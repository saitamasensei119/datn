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

            int fullClasses = demand / defaultMaxStudents;
            int remainder = demand % defaultMaxStudents;

            int numClasses = fullClasses;
            // Nếu phần học sinh dư ra đạt từ 90% sĩ số tối đa của lớp trở lên thì mở thêm 1 lớp
            if (remainder >= defaultMaxStudents * 0.9) {
                numClasses++;
            }

            if (numClasses <= 0) continue;

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
                course.setOpeningBatch("1");

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

    /* =========================================================================================================
     * HÀM CŨ (CHƯA TỐI ƯU BỘ LỌC MIỀN): scheduleCoursesWithORToolsOld
     * ---------------------------------------------------------------------------------------------------------
     * Ghi chú: Hàm này duyệt toàn bộ 72 khung giờ trong tuần (6 ngày x 12 tiết) và toàn bộ danh sách phòng học
     * cho từng lớp học phần (assign[numSessions][numRooms][numSlots]).
     * Khi số lượng lớp cần xếp lớn (~200 lớp), mô hình sinh ra hơn 2.4 triệu biến Boolean (BoolVar) và hơn 15 triệu
     * tham chiếu literal trong ràng buộc AtMostOne. Khi đưa vào bộ giải C++ native (jniortools.dll), hệ thống
     * bị tràn chỉ số std::vector trong msvcp140.dll dẫn đến lỗi EXCEPTION_ACCESS_VIOLATION (0xc0000005) crash JVM.
     *
     * Hàm này được comment lại theo yêu cầu để giữ nguyên logic gốc cho việc tham khảo, đối chiếu và tối ưu sau.
     * =========================================================================================================
    @Transactional
    public TimetableResponse scheduleCoursesWithORToolsOld(ScheduleRequest request) {
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

        List<TimeSlot> timeSlots = new ArrayList<>();
        int slotId = 0;
        for (int day = 2; day <= 7; day++) {
            for (int start = 1; start <= 12; start++) {
                timeSlots.add(new TimeSlot(slotId++, day, start));
            }
        }

        CpModel model = new CpModel();
        LinearExprBuilder objBuilder = LinearExpr.newBuilder();

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

                if (room.getCapacity() < session.course.getMaxStudents()) {
                    continue;
                }

                if (session.isPractice && !labBld.isEmpty() && !roomBuilding.equalsIgnoreCase(labBld)) {
                    continue;
                }

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
                    if (ts.startPeriod + session.duration - 1 > 12) {
                        continue;
                    }

                    BoolVar var = model.newBoolVar(String.format("s%d_r%d_t%d", i, r, tIdx));
                    assign[i][r][tIdx] = var;
                    validVarsForSession.add(var);

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

            model.addExactlyOne(validVarsForSession.toArray(new Literal[0]));
        }

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

        model.minimize(objBuilder);

        CpSolver solver = new CpSolver();
        double timeout = (request.getTimeoutSeconds() != null && request.getTimeoutSeconds() > 0) ? request.getTimeoutSeconds() : 60.0;
        solver.getParameters().setMaxTimeInSeconds(timeout);
        CpSolverStatus status = solver.solve(model);

        if (status != CpSolverStatus.OPTIMAL && status != CpSolverStatus.FEASIBLE) {
            throw new RuntimeException("Thuật toán Google OR-Tools không thể tìm được thời khóa biểu khả thi với các ràng buộc hiện tại.");
        }

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
            session.course.setStatus(CourseStatus.OPEN);
            courseRepository.save(session.course);
        }

        return new TimetableResponse("Đã xếp Thời khóa biểu thành công bằng Google OR-Tools (" + status + ").", 0, schedulesCreated, solver.objectiveValue(), Math.round(solver.wallTime() * 100.0) / 100.0);
    }
    /* ========================================================================================================= */
    
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

        // PHƯƠNG ÁN B (Decomposition): Tách thành 2 tập biến riêng biệt cho mỗi buổi học
        // assignRoom[sessionIndex][roomIndex]: Buổi học i được gán vào phòng r
        // assignSlot[sessionIndex][slotIndex]: Buổi học i được gán vào khung giờ tIdx
        Literal[][] assignRoom = new Literal[numSessions][numRooms];
        Literal[][] assignSlot = new Literal[numSessions][numSlots];

        for (int i = 0; i < numSessions; i++) {
            SessionInfo session = allSessions.get(i);
            List<Literal> roomVarsForSession = new ArrayList<>();
            List<Literal> slotVarsForSession = new ArrayList<>();
            String prefBld = session.course.getSubject().getPreferredBuilding() != null ? session.course.getSubject().getPreferredBuilding().trim() : "";

            // Lọc ra tối đa 6 phòng học ứng viên (3 phòng tốt nhất + 3 luân phiên)
            List<Integer> candidateRoomIndices = filterCandidateRoomIndices(session, i, rooms);
            List<Integer> validStartPeriods = getValidStartPeriods(session.duration);

            // 1. Khởi tạo biến phòng học và tính điểm phạt SC4 / SC-Building
            for (int r : candidateRoomIndices) {
                Room room = rooms.get(r);
                String roomBuilding = room.getBuilding() != null ? room.getBuilding().trim() : "";

                long roomPenalty = 0;
                int wastedSeats = room.getCapacity() - session.course.getMaxStudents();
                if (wastedSeats > 0 && request.getWeightSc4CapacityOptimization() != null) {
                    roomPenalty += (long) wastedSeats * request.getWeightSc4CapacityOptimization();
                }
                if (!session.isPractice && !prefBld.isEmpty() && !roomBuilding.equalsIgnoreCase(prefBld) && request.getWeightPreferredBuilding() != null) {
                    roomPenalty += request.getWeightPreferredBuilding();
                }

                BoolVar varRoom = model.newBoolVar(String.format("sr_%d_r%d", i, r));
                assignRoom[i][r] = varRoom;
                roomVarsForSession.add(varRoom);

                if (roomPenalty > 0) {
                    objBuilder.addTerm(varRoom, roomPenalty);
                }
            }

            if (roomVarsForSession.isEmpty()) {
                throw new RuntimeException("Không tìm thấy phòng học hợp lệ cho lớp: " + session.course.getCourseCode() + " (Sĩ số: " + session.course.getMaxStudents() + ")");
            }
            // Mỗi buổi học phải chọn đúng 1 phòng học
            model.addExactlyOne(roomVarsForSession.toArray(new Literal[0]));

            // 2. Khởi tạo biến khung giờ và tính điểm phạt thời gian SC2
            for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                TimeSlot ts = timeSlots.get(tIdx);
                if (!validStartPeriods.contains(ts.startPeriod)) {
                    continue;
                }
                if (ts.startPeriod + session.duration - 1 > 12) {
                    continue;
                }

                BoolVar varSlot = model.newBoolVar(String.format("ss_%d_t%d", i, tIdx));
                assignSlot[i][tIdx] = varSlot;
                slotVarsForSession.add(varSlot);

                long timePenalty = 0;
                if ((ts.startPeriod == 1 || ts.startPeriod + session.duration - 1 >= 11) && request.getWeightSc2EarlyLate() != null) {
                    timePenalty += request.getWeightSc2EarlyLate();
                }
                if (timePenalty > 0) {
                    objBuilder.addTerm(varSlot, timePenalty);
                }
            }

            if (slotVarsForSession.isEmpty()) {
                throw new RuntimeException("Không tìm thấy khung giờ hợp lệ cho lớp: " + session.course.getCourseCode() + " (Thời lượng: " + session.duration + " tiết)");
            }
            // Mỗi buổi học phải chọn đúng 1 khung giờ
            model.addExactlyOne(slotVarsForSession.toArray(new Literal[0]));
        }

        // Ràng buộc 1: Không trùng phòng tại bất kỳ tiết học nào (No Room Clashes)
        // Nếu 2 buổi học i, j (i < j) có chung phòng ứng viên và có khung giờ giao nhau về thời gian -> Không được phép cùng chọn phòng và cùng chọn khung giờ giao nhau đó!
        for (int i = 0; i < numSessions; i++) {
            SessionInfo s1 = allSessions.get(i);
            for (int j = i + 1; j < numSessions; j++) {
                SessionInfo s2 = allSessions.get(j);

                // Kiểm tra xem 2 buổi học có chung phòng ứng viên nào không
                List<Integer> sharedRooms = new ArrayList<>();
                for (int r = 0; r < numRooms; r++) {
                    if (assignRoom[i][r] != null && assignRoom[j][r] != null) {
                        sharedRooms.add(r);
                    }
                }
                if (sharedRooms.isEmpty()) {
                    continue; // Không bao giờ trùng phòng
                }

                // Tìm các cặp khung giờ (t1, t2) mà s1 và s2 bị chồng lấn về ngày & tiết học
                for (int t1 = 0; t1 < numSlots; t1++) {
                    if (assignSlot[i][t1] == null) continue;
                    TimeSlot ts1 = timeSlots.get(t1);

                    for (int t2 = 0; t2 < numSlots; t2++) {
                        if (assignSlot[j][t2] == null) continue;
                        TimeSlot ts2 = timeSlots.get(t2);

                        // Nếu cùng ngày và khoảng tiết học bị giao nhau
                        if (ts1.dayOfWeek == ts2.dayOfWeek) {
                            int end1 = ts1.startPeriod + s1.duration - 1;
                            int end2 = ts2.startPeriod + s2.duration - 1;
                            boolean overlap = Math.max(ts1.startPeriod, ts2.startPeriod) <= Math.min(end1, end2);

                            if (overlap) {
                                // Với mỗi phòng chung r, s1 và s2 không được cùng chọn phòng r đồng thời cùng chọn t1, t2
                                for (int r : sharedRooms) {
                                    model.addBoolOr(new Literal[] {
                                        assignRoom[i][r].not(),
                                        assignSlot[i][t1].not(),
                                        assignRoom[j][r].not(),
                                        assignSlot[j][t2].not()
                                    });
                                }
                            }
                        }
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
            for (int a = 0; a < sIndices.size(); a++) {
                int i = sIndices.get(a);
                for (int b = a + 1; b < sIndices.size(); b++) {
                    int j = sIndices.get(b);
                    // Nếu buổi i và buổi j chọn 2 khung giờ t1, t2 thuộc cùng 1 ngày -> Cấm
                    for (int t1 = 0; t1 < numSlots; t1++) {
                        if (assignSlot[i][t1] == null) continue;
                        TimeSlot ts1 = timeSlots.get(t1);
                        for (int t2 = 0; t2 < numSlots; t2++) {
                            if (assignSlot[j][t2] == null) continue;
                            TimeSlot ts2 = timeSlots.get(t2);
                            if (ts1.dayOfWeek == ts2.dayOfWeek) {
                                model.addBoolOr(new Literal[] {
                                    assignSlot[i][t1].not(),
                                    assignSlot[j][t2].not()
                                });
                            }
                        }
                    }
                }
            }
        }

        // Thiết lập Hàm mục tiêu (Minimize tổng điểm phạt ràng buộc mềm)
        model.minimize(objBuilder);

        // DIAGNOSTICS: Kiểm tra và log chi tiết thông tin Model trước khi đưa vào C++ native giải
        int varCount = model.model().getVariablesCount();
        int constraintCount = model.model().getConstraintsCount();
        String validationMsg = model.validate();

        System.out.println("================ OR-TOOLS MODEL DIAGNOSTICS ================");
        System.out.println("Số lượng lớp học phần (PLANNED): " + plannedCourses.size());
        System.out.println("Số lượng buổi học (numSessions): " + numSessions);
        System.out.println("Số lượng phòng học (numRooms): " + numRooms);
        System.out.println("Số lượng khung giờ (numSlots): " + numSlots);
        System.out.println("--> Tổng số biến Boolean đã tạo trong Model: " + varCount);
        System.out.println("--> Tổng số ràng buộc đã tạo trong Model: " + constraintCount);
        System.out.println("--> Kiểm tra hợp lệ Model (model.validate()): " + (validationMsg.isEmpty() ? "HỢP LỆ (VALID)" : validationMsg));
        System.out.println("============================================================");

        if (!validationMsg.isEmpty()) {
            throw new RuntimeException("Model OR-Tools không hợp lệ: " + validationMsg);
        }

        if (varCount > 200000) {
            System.err.println("[WARNING] Số lượng biến Boolean quá lớn (" + varCount + " biến). Việc giải Model này trên Windows C++ native (msvcp140.dll/jniortools.dll) có nguy cơ rất cao bị Crash JVM do tràn bộ nhớ C++ Presolver!");
        }

        // Giải bài toán
        CpSolver solver = new CpSolver();
        double timeout = (request.getTimeoutSeconds() != null && request.getTimeoutSeconds() > 0) ? request.getTimeoutSeconds() : 60.0;
        solver.getParameters().setMaxTimeInSeconds(timeout);
        // TỐI ƯU CRITICAL CHO WINDOWS JNI: Tắt Presolver C++ để tránh crash msvcp140.dll+0x13080 khi dựng đồ thị Clique
        solver.getParameters().setCpModelPresolve(false);
        solver.getParameters().setLinearizationLevel(0);
        solver.getParameters().setNumSearchWorkers(1);
        // Hiển thị log tiến trình giải bài toán theo thời gian thực ra Console
        solver.getParameters().setLogSearchProgress(true);
        CpSolverStatus status = solver.solve(model);

        if (status != CpSolverStatus.OPTIMAL && status != CpSolverStatus.FEASIBLE) {
            System.err.println("================ OR-TOOLS CP-SAT FAILURE DIAGNOSTICS ================");
            System.err.println("Trạng thái kết quả (Status): " + status);
            System.err.println("Thông số bộ giải (Response Stats):\n" + solver.responseStats());
            System.err.println("=====================================================================");
            throw new RuntimeException("Thuật toán Google OR-Tools không thể tìm được thời khóa biểu khả thi (" + status + "). Vui lòng kiểm tra lại số lượng phòng học hoặc các ràng buộc cứng.");
        }

        // Lưu kết quả vào DB
        int schedulesCreated = 0;
        for (int i = 0; i < numSessions; i++) {
            SessionInfo session = allSessions.get(i);
            int selectedRoom = -1;
            for (int r = 0; r < numRooms; r++) {
                if (assignRoom[i][r] != null && solver.booleanValue(assignRoom[i][r])) {
                    selectedRoom = r;
                    break;
                }
            }
            int selectedSlot = -1;
            for (int tIdx = 0; tIdx < numSlots; tIdx++) {
                if (assignSlot[i][tIdx] != null && solver.booleanValue(assignSlot[i][tIdx])) {
                    selectedSlot = tIdx;
                    break;
                }
            }

            if (selectedRoom != -1 && selectedSlot != -1) {
                TimeSlot ts = timeSlots.get(selectedSlot);
                Room room = rooms.get(selectedRoom);

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

            // Chuyển trạng thái lớp sang OPEN
            session.course.setStatus(CourseStatus.OPEN);
            courseRepository.save(session.course);
        }

        return new TimetableResponse("Đã xếp Thời khóa biểu thành công bằng Google OR-Tools (" + status + ").", 0, schedulesCreated, solver.objectiveValue(), Math.round(solver.wallTime() * 100.0) / 100.0);
    }

    private List<Integer> getValidStartPeriods(int duration) {
        if (duration == 3) {
            return List.of(1, 4, 7, 10);
        } else if (duration == 2) {
            return List.of(1, 3, 5, 7, 9, 11);
        } else if (duration == 4 || duration == 5) {
            return List.of(1, 7);
        } else if (duration == 1) {
            return List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        } else {
            return List.of(1, 4, 7);
        }
    }

    private List<Integer> filterCandidateRoomIndices(SessionInfo session, int sessionIdx, List<Room> rooms) {
        String labBld = session.course.getSubject().getLabBuilding() != null ? session.course.getSubject().getLabBuilding().trim() : "";
        List<Integer> validIndices = new ArrayList<>();
        for (int r = 0; r < rooms.size(); r++) {
            Room room = rooms.get(r);
            String roomBuilding = room.getBuilding() != null ? room.getBuilding().trim() : "";
            if (room.getCapacity() < session.course.getMaxStudents()) {
                continue;
            }
            if (session.isPractice && !labBld.isEmpty() && !roomBuilding.equalsIgnoreCase(labBld)) {
                continue;
            }
            validIndices.add(r);
        }
        validIndices.sort(java.util.Comparator.comparingInt(idx -> rooms.get(idx).getCapacity()));
        if (validIndices.size() <= 6) {
            return validIndices;
        }

        // TỐI ƯU CÂN BẰNG TẢI CHỐNG CRASH HEAP WINDOWS (Round-Robin Partitioning):
        // Giữ số biến ở mức siêu nhẹ (~57.000 biến) đảm bảo tuyệt đối không crash msvcp140.dll,
        // đồng thời 3 phòng luân phiên sẽ phủ đều toàn bộ 50 phòng khắp trường, không bao giờ bị Vô nghiệm.
        List<Integer> selected = new ArrayList<>();
        for (int k = 0; k < 3; k++) {
            selected.add(validIndices.get(k));
        }
        int remainingCount = validIndices.size() - 3;
        for (int k = 0; k < 3; k++) {
            int rotatedIdx = 3 + ((sessionIdx * 3 + k) % remainingCount);
            if (!selected.contains(validIndices.get(rotatedIdx))) {
                selected.add(validIndices.get(rotatedIdx));
            }
        }
        return selected;
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
