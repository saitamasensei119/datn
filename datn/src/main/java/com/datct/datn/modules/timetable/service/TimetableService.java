package com.datct.datn.modules.timetable.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.enrollment.repository.PreRegistrationRepository;
import com.datct.datn.modules.grade.entity.GradeComponent;
import com.datct.datn.modules.grade.entity.GradeSubmission;
import com.datct.datn.modules.grade.repository.GradeSubmissionRepository;
import com.datct.datn.modules.schedule.entity.Room;
import com.datct.datn.modules.schedule.repository.RoomRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.ScheduleRequest;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.TimetableResponse;
import com.datct.datn.modules.timetable.entity.ClassSchedule;
import com.datct.datn.modules.timetable.repository.ClassScheduleRepository;
import com.google.ortools.Loader;
import com.google.ortools.sat.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

    private final PreRegistrationRepository preRegistrationRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final RoomRepository roomRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;
    private final AhpWeightService ahpWeightService;

    @Transactional
    public TimetableResponse generateCoursesFromDemand(Long semesterId, int defaultMaxStudents) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ"));

        List<Object[]> demandList = preRegistrationRepository.countSubjectDemandBySemesterId(semesterId);

        int coursesGenerated = 0;

        for (Object[] row : demandList) {
            Subject subject = (Subject) row[0];
            Long countLong = (Long) row[1];
            int demand = countLong.intValue();

            if (demand <= 0) continue;

            int numClasses = (int) Math.ceil((double) demand / defaultMaxStudents);

            for (int i = 1; i <= numClasses; i++) {
                String courseCode = String.format("%s_%02d", subject.getSubjectCode(), i);
                
                // Nếu mã lớp đã tồn tại thì bỏ qua hoặc tạo mã khác
                if (courseRepository.existsByCourseCode(courseCode)) {
                    courseCode = String.format("%s_S%d_%02d", subject.getSubjectCode(), semesterId, i);
                    if (courseRepository.existsByCourseCode(courseCode)) continue;
                }

                Course course = new Course();
                course.setCourseCode(courseCode);
                course.setMaxStudents(defaultMaxStudents);
                course.setSubject(subject);
                course.setSemester(semester);
                course.setStatus(CourseStatus.PLANNED);
                course.setAttachedCourseCode(subject.getSubjectCode());
                course.setNote("Tự động sinh từ nguyện vọng đăng ký (Sĩ số dự kiến: " + demand + ")");
                course.setOpeningBatch("Đợt 1");

                GradeComponent gc = new GradeComponent();
                gc.setCourse(course);
                gc.setMidtermWeight(0.4);
                course.setGradeComponent(gc);

                Course saved = courseRepository.save(course);

                GradeSubmission midtermSubmission = GradeSubmission.builder()
                        .course(saved)
                        .gradeType("MIDTERM")
                        .status("NOT_SUBMITTED")
                        .build();
                GradeSubmission finalSubmission = GradeSubmission.builder()
                        .course(saved)
                        .gradeType("FINAL")
                        .status("NOT_SUBMITTED")
                        .build();
                gradeSubmissionRepository.save(midtermSubmission);
                gradeSubmissionRepository.save(finalSubmission);

                coursesGenerated++;
            }
        }

        return new TimetableResponse("Đã tự động sinh thành công các lớp học phần từ nguyện vọng.", coursesGenerated, 0, 0.0);
    }

    @Transactional
    public TimetableResponse scheduleCoursesWithORTools(ScheduleRequest request) {
        Long semesterId = request.getSemesterId();
        Loader.loadNativeLibraries();

        List<Course> plannedCourses = courseRepository.findBySemesterIdAndStatus(semesterId, CourseStatus.PLANNED);
        if (plannedCourses.isEmpty()) {
            throw new RuntimeException("Không có lớp học phần nào ở trạng thái PLANNED trong học kỳ này để xếp lịch.");
        }

        List<Room> rooms = roomRepository.findAll();
        if (rooms.isEmpty()) {
            throw new RuntimeException("Hệ thống chưa có dữ liệu Phòng học (Rooms). Vui lòng thêm phòng học trước.");
        }

        // Bóc tách buổi học theo quy tắc:
        // lý thuyết + bài tập <= 3: 1 buổi
        // 4-5: 2 buổi
        // 6-7: 3 buổi
        // 8-9: 4 buổi
        // thực hành: riêng 1 buổi
        List<SessionInfo> allSessions = new ArrayList<>();
        int sessionCounter = 0;

        for (Course course : plannedCourses) {
            Subject subj = course.getSubject();
            int t = (subj.getTheoryCredits() != null ? subj.getTheoryCredits() : 0);
            int e = (subj.getExerciseCredits() != null ? subj.getExerciseCredits() : 0);
            int p = (subj.getPracticalCredits() != null ? subj.getPracticalCredits() : 0);

            int totalTE = t + e;
            if (totalTE <= 0 && p <= 0) {
                totalTE = subj.getCredits() != null ? subj.getCredits() : 3;
            }

            List<Integer> durations = splitDurations(totalTE);
            int sessionNum = 1;
            for (int dur : durations) {
                allSessions.add(new SessionInfo(sessionCounter++, course, sessionNum++, dur, false));
            }
            if (p > 0) {
                allSessions.add(new SessionInfo(sessionCounter++, course, sessionNum++, p, true));
            }
        }

        // Tạo danh sách các khung giờ hợp lệ trong tuần
        // Ngày từ Thứ 2 (2) đến Thứ 7 (7), mỗi ngày 12 tiết
        List<TimeSlot> timeSlots = new ArrayList<>();
        int slotId = 0;
        for (int day = 2; day <= 7; day++) {
            for (int start = 1; start <= 12; start++) {
                timeSlots.add(new TimeSlot(slotId++, day, start));
            }
        }

        CpModel model = new CpModel();
        LinearExprBuilder objBuilder = LinearExpr.newBuilder();

        // assign[sessionIndex][roomIndex][slotIndex]
        int numSessions = allSessions.size();
        int numRooms = rooms.size();
        int numSlots = timeSlots.size();

        Literal[][][] assign = new Literal[numSessions][numRooms][numSlots];

        for (int i = 0; i < numSessions; i++) {
            SessionInfo session = allSessions.get(i);
            List<Literal> validVarsForSession = new ArrayList<>();
            String labBld = session.course.getSubject().getLabBuilding() != null ? session.course.getSubject().getLabBuilding().trim() : "";
            String prefBld = session.course.getSubject().getPreferredBuilding() != null ? session.course.getSubject().getPreferredBuilding().trim() : "";

            for (int r = 0; r < numRooms; r++) {
                Room room = rooms.get(r);
                String roomBuilding = room.getBuilding() != null ? room.getBuilding().trim() : "";

                // Ràng buộc sức chứa
                if (room.getCapacity() < session.course.getMaxStudents()) {
                    continue;
                }

                // RÀNG BUỘC CỨNG: Nếu buổi thực hành có yêu cầu tòa nhà thí nghiệm, phòng bắt buộc phải thuộc tòa đó
                if (session.isPractice && !labBld.isEmpty() && !roomBuilding.equalsIgnoreCase(labBld)) {
                    continue;
                }

                // Tính toán điểm phạt SC4 (Lãng phí chỗ ngồi) và SC-Building (Khác tòa ưu tiên)
                long roomPenalty = 0;
                int wastedSeats = room.getCapacity() - session.course.getMaxStudents();
                if (wastedSeats > 0 && request.getWeightSc4CapacityOptimization() != null) {
                    roomPenalty += (long) wastedSeats * request.getWeightSc4CapacityOptimization();
                }
                if (!session.isPractice && !prefBld.isEmpty() && !roomBuilding.equalsIgnoreCase(prefBld) && request.getWeightPreferredBuilding() != null) {
                    roomPenalty += request.getWeightPreferredBuilding();
                }

                for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                    TimeSlot ts = timeSlots.get(tIdx);
                    // Ràng buộc không vượt quá tiết 12 trong ngày
                    if (ts.startPeriod + session.duration - 1 > 12) {
                        continue;
                    }

                    BoolVar var = model.newBoolVar(String.format("s%d_r%d_t%d", i, r, tIdx));
                    assign[i][r][tIdx] = var;
                    validVarsForSession.add(var);

                    // Tính điểm phạt thời gian: SC2 (Tiết 1 / Tiết cuối tối) & SC7 (Khung giờ lỡ dở)
                    long timePenalty = 0;
                    if ((ts.startPeriod == 1 || ts.startPeriod + session.duration - 1 >= 11) && request.getWeightSc2EarlyLate() != null) {
                        timePenalty += request.getWeightSc2EarlyLate();
                    }
                    if (session.duration == 3 && ts.startPeriod != 1 && ts.startPeriod != 4 && ts.startPeriod != 7 && ts.startPeriod != 10 && request.getWeightSc7ShiftContiguity() != null) {
                        timePenalty += request.getWeightSc7ShiftContiguity();
                    }

                    long totalPenalty = roomPenalty + timePenalty;
                    if (totalPenalty > 0) {
                        objBuilder.addTerm(var, totalPenalty);
                    }
                }
            }

            if (validVarsForSession.isEmpty()) {
                throw new RuntimeException("Không tìm thấy phòng học hoặc khung giờ hợp lệ cho lớp: " + session.course.getCourseCode() + " (Sĩ số: " + session.course.getMaxStudents() + ", Thời lượng: " + session.duration + " tiết)");
            }

            // Mỗi buổi học phải được gán vào đúng 1 phòng và 1 thời điểm
            model.addExactlyOne(validVarsForSession.toArray(new Literal[0]));
        }

        // Ràng buộc 1: Không trùng phòng tại bất kỳ tiết học (period 1..72 trong tuần) nào
        for (int r = 0; r < numRooms; r++) {
            for (int day = 2; day <= 7; day++) {
                for (int period = 1; period <= 12; period++) {
                    List<Literal> activeAtPeriod = new ArrayList<>();

                    for (int i = 0; i < numSessions; i++) {
                        SessionInfo session = allSessions.get(i);
                        for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                            Literal var = assign[i][r][tIdx];
                            if (var == null) continue;
                            TimeSlot ts = timeSlots.get(tIdx);
                            if (ts.dayOfWeek == day && period >= ts.startPeriod && period <= (ts.startPeriod + session.duration - 1)) {
                                activeAtPeriod.add(var);
                            }
                        }
                    }

                    if (activeAtPeriod.size() > 1) {
                        model.addAtMostOne(activeAtPeriod.toArray(new Literal[0]));
                    }
                }
            }
        }



        // Ràng buộc 3: Các buổi học của cùng 1 Lớp học phần nên học ở các ngày khác nhau (tránh học 2 buổi cùng 1 ngày)
        Map<Long, List<Integer>> courseSessions = new HashMap<>();
        for (int i = 0; i < numSessions; i++) {
            courseSessions.computeIfAbsent(allSessions.get(i).course.getId(), k -> new ArrayList<>()).add(i);
        }

        for (List<Integer> sIndices : courseSessions.values()) {
            if (sIndices.size() <= 1) continue;
            for (int day = 2; day <= 7; day++) {
                List<Literal> onSameDay = new ArrayList<>();
                for (int i : sIndices) {
                    for (int r = 0; r < numRooms; r++) {
                        for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                            Literal var = assign[i][r][tIdx];
                            if (var == null) continue;
                            if (timeSlots.get(tIdx).dayOfWeek == day) {
                                onSameDay.add(var);
                            }
                        }
                    }
                }
                if (onSameDay.size() > 1) {
                    model.addAtMostOne(onSameDay.toArray(new Literal[0]));
                }
            }
        }

        // Thiết lập Hàm mục tiêu (Minimize tổng điểm phạt ràng buộc mềm)
        model.minimize(objBuilder);

        // Giải bài toán
        CpSolver solver = new CpSolver();
        double timeout = (request.getTimeoutSeconds() != null && request.getTimeoutSeconds() > 0) ? request.getTimeoutSeconds() : 60.0;
        solver.getParameters().setMaxTimeInSeconds(timeout);
        CpSolverStatus status = solver.solve(model);

        if (status != CpSolverStatus.OPTIMAL && status != CpSolverStatus.FEASIBLE) {
            throw new RuntimeException("Thuật toán Google OR-Tools không thể tìm được thời khóa biểu khả thi với các ràng buộc hiện tại.");
        }

        // Lưu kết quả vào DB
        int schedulesCreated = 0;
        for (int i = 0; i < numSessions; i++) {
            SessionInfo session = allSessions.get(i);
            for (int r = 0; r < numRooms; r++) {
                for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                    Literal var = assign[i][r][tIdx];
                    if (var != null && solver.booleanValue(var)) {
                        TimeSlot ts = timeSlots.get(tIdx);
                        Room room = rooms.get(r);

                        ClassSchedule cs = new ClassSchedule();
                        cs.setCourse(session.course);
                        cs.setSessionNumber(session.sessionNum);
                        cs.setDayOfWeek(ts.dayOfWeek);
                        cs.setStartPeriod(ts.startPeriod);
                        cs.setEndPeriod(ts.startPeriod + session.duration - 1);
                        cs.setShift(ts.startPeriod <= 6 ? "Sáng" : "Chiều");
                        cs.setTimeString(String.format("Tiết %d - %d", cs.getStartPeriod(), cs.getEndPeriod()));
                        cs.setWeekPattern("1-15");
                        cs.setRoom(room);

                        classScheduleRepository.save(cs);
                        schedulesCreated++;
                    }
                }
            }
            // Chuyển trạng thái lớp sang OPEN
            session.course.setStatus(CourseStatus.OPEN);
            courseRepository.save(session.course);
        }

        return new TimetableResponse("Đã xếp Thời khóa biểu thành công bằng Google OR-Tools (" + status + ").", 0, schedulesCreated, solver.objectiveValue());
    }

    private List<Integer> splitDurations(int totalTE) {
        List<Integer> list = new ArrayList<>();
        if (totalTE <= 3) {
            list.add(Math.max(1, totalTE));
        } else if (totalTE == 4) {
            list.add(2); list.add(2);
        } else if (totalTE == 5) {
            list.add(3); list.add(2);
        } else if (totalTE == 6) {
            list.add(2); list.add(2); list.add(2);
        } else if (totalTE == 7) {
            list.add(3); list.add(2); list.add(2);
        } else if (totalTE == 8) {
            list.add(2); list.add(2); list.add(2); list.add(2);
        } else {
            list.add(3); list.add(2); list.add(2); list.add(2);
        }
        return list;
    }

    @Transactional(readOnly = true)
    public byte[] exportTimetableExcel(Long semesterId) {
        List<ClassSchedule> schedules = classScheduleRepository.findByCourse_Semester_Id(semesterId);
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Thời Khóa Biểu");

            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Mã Lớp HP", "Tên Môn Học", "Sĩ Số", "Buổi số", "Thứ", "Tiết Bắt Đầu", "Tiết Kết Thúc", "Phòng Học"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (ClassSchedule cs : schedules) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(cs.getCourse() != null ? cs.getCourse().getCourseCode() : "");
                row.createCell(2).setCellValue(cs.getCourse() != null && cs.getCourse().getSubject() != null ? cs.getCourse().getSubject().getName() : "");
                row.createCell(3).setCellValue(cs.getCourse() != null ? cs.getCourse().getMaxStudents() : 0);
                row.createCell(4).setCellValue(cs.getSessionNumber() != null ? cs.getSessionNumber() : 0);
                row.createCell(5).setCellValue(cs.getDayOfWeek() != null ? "Thứ " + cs.getDayOfWeek() : "");
                row.createCell(6).setCellValue(cs.getStartPeriod() != null ? cs.getStartPeriod() : 0);
                row.createCell(7).setCellValue(cs.getEndPeriod() != null ? cs.getEndPeriod() : 0);
                row.createCell(8).setCellValue(cs.getRoom() != null ? cs.getRoom().getRoomName() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xuất Excel TKB: " + e.getMessage(), e);
        }
    }

    private record SessionInfo(int id, Course course, int sessionNum, int duration, boolean isPractice) {}
    private record TimeSlot(int id, int dayOfWeek, int startPeriod) {}
}
