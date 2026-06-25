package com.datct.datn.modules.course.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.grade.entity.GradeComponent;
import com.datct.datn.modules.grade.entity.GradeSubmission;
import com.datct.datn.modules.grade.repository.GradeSubmissionRepository;
import com.datct.datn.modules.schedule.entity.Room;
import com.datct.datn.modules.schedule.repository.RoomRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import com.datct.datn.modules.timetable.entity.ClassSchedule;
import com.datct.datn.modules.timetable.repository.ClassScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class CourseImportService {

    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final RoomRepository roomRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file, Long semesterId) {
        Map<String, Object> result = new HashMap<>();
        int courseCount = 0;
        int scheduleCount = 0;
        int errorCount = 0;

        Semester defaultSemester = semesterId != null 
            ? semesterRepository.findById(semesterId).orElse(null) 
            : null;

        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        long totalDbSaveTime = 0;
        long memoryUsedMB = 0;
        long startTime = System.currentTimeMillis();
        long peak = 0;

        // 1. In-memory Caching (Diệt 80,000 câu lệnh SELECT N+1)
        Map<String, Subject> subjectMap = new HashMap<>();
        for (Subject s : subjectRepository.findAll()) {
            if (s.getSubjectCode() != null) subjectMap.put(s.getSubjectCode().toLowerCase().trim(), s);
        }
        Map<String, Semester> semesterMap = new HashMap<>();
        for (Semester s : semesterRepository.findAll()) {
            if (s.getName() != null) semesterMap.put(s.getName().toLowerCase().trim(), s);
        }
        Map<String, Room> roomMap = new HashMap<>();
        for (Room r : roomRepository.findAll()) {
            if (r.getRoomName() != null) roomMap.put(r.getRoomName().toLowerCase().trim(), r);
        }
        Map<String, Course> courseMap = new HashMap<>();
        for (Course c : courseRepository.findAll()) {
            if (c.getCourseCode() != null) courseMap.put(c.getCourseCode().toLowerCase().trim(), c);
        }

        List<ClassSchedule> scheduleBatch = new java.util.ArrayList<>();

        try (InputStream is = file.getInputStream(); 
             Workbook workbook = com.github.pjfanning.xlsx.StreamingReader.builder()
                .rowCacheSize(100)
                .bufferSize(4096)
                .open(is)) {
            long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
            memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);
            log.info("==== THÔNG SỐ RAM ====");
            log.info("RAM tiêu thụ để bung file Excel: {} MB", memoryUsedMB);

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header
                long used = runtime.totalMemory() - runtime.freeMemory();
                peak = Math.max(peak, used);
                try {
                    String courseCode = getCellString(row.getCell(2));
                    if (courseCode.isEmpty()) continue;

                    Course course = courseMap.get(courseCode.toLowerCase());

                    // Create Course if not exists
                    if (course == null) {
                        String subjectCode = getCellString(row.getCell(4));
                        Subject subject = subjectMap.get(subjectCode.toLowerCase());
                        if (subject == null) {
                            throw new RuntimeException("Không tìm thấy môn học mã: " + subjectCode);
                        }

                        // Update Subject extra info
                        String mgmtCode = getCellString(row.getCell(23));
                        if ("CT CHUẨN".equalsIgnoreCase(mgmtCode.trim())) {
                            mgmtCode = "CT_CHUAN";
                        }
                        subject.setManagementCode(mgmtCode);
                        subject.setSubjectType(getCellString(row.getCell(21)));
                        subject.setLabRequirement(getCellString(row.getCell(17)));
                        
                        long dbSaveStartTime1 = System.currentTimeMillis();
                        subjectRepository.save(subject);
                        totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime1);

                        // Handle Semester
                        String semesterName = getCellString(row.getCell(0));
                        Semester semester = defaultSemester;
                        if (semester == null && !semesterName.isEmpty()) {
                            semester = semesterMap.get(semesterName.toLowerCase());
                        }
                        if (semester == null) {
                            throw new RuntimeException("Không tìm thấy học kỳ: " + semesterName);
                        }

                        course = new Course();
                        course.setCourseCode(courseCode);
                        course.setSubject(subject);
                        course.setSemester(semester);
                        course.setLecturer(null);
                        course.setMaxStudents(getCellInt(row.getCell(19)));
                        course.setAttachedCourseCode(getCellString(row.getCell(3)));
                        course.setNote(getCellString(row.getCell(8)));
                        course.setOpeningBatch(getCellString(row.getCell(22)));
                        course.setStatus(CourseStatus.PLANNED);

                        GradeComponent gc = new GradeComponent();
                        gc.setCourse(course);
                        gc.setMidtermWeight(0.5);
                        course.setGradeComponent(gc);

                        long dbSaveStartTime2 = System.currentTimeMillis();
                        course = courseRepository.save(course);
                        totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime2);

                        GradeSubmission midterm = GradeSubmission.builder().course(course).gradeType("MIDTERM").status("NOT_SUBMITTED").build();
                        GradeSubmission finalGrade = GradeSubmission.builder().course(course).gradeType("FINAL").status("NOT_SUBMITTED").build();
                        
                        long dbSaveStartTime3 = System.currentTimeMillis();
                        gradeSubmissionRepository.save(midterm);
                        gradeSubmissionRepository.save(finalGrade);
                        totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime3);

                        courseMap.put(courseCode.toLowerCase(), course);
                        courseCount++;
                    }

                    // Create ClassSchedule
                    ClassSchedule schedule = new ClassSchedule();
                    schedule.setCourse(course);
                    schedule.setSessionNumber(getCellInt(row.getCell(9)));
                    schedule.setDayOfWeek(getCellInt(row.getCell(10)));
                    schedule.setTimeString(getCellString(row.getCell(11)));
                    schedule.setStartPeriod(getCellInt(row.getCell(12)));
                    schedule.setEndPeriod(getCellInt(row.getCell(13)));
                    schedule.setShift(getCellString(row.getCell(14)));
                    schedule.setWeekPattern(getCellString(row.getCell(15)));

                    String roomName = getCellString(row.getCell(16));
                    if (!roomName.isEmpty()) {
                        Room room = roomMap.get(roomName.toLowerCase());
                        schedule.setRoom(room);
                    }

                    scheduleBatch.add(schedule);
                    scheduleCount++;

                    // Gom lô 500 bản ghi Batch Insert
                    if (scheduleBatch.size() >= 500) {
                        long dbSaveStartTime4 = System.currentTimeMillis();
                        classScheduleRepository.saveAll(scheduleBatch);
                        totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime4);
                        scheduleBatch.clear();
                    }

                } catch (Exception e) {
                    errorCount++;
                    System.out.println("Lỗi dòng " + row.getRowNum() + ": " + e.getMessage());
                }
            }

            // Lưu nốt số lịch học còn dư trong lô
            if (!scheduleBatch.isEmpty()) {
                long dbSaveStartTime4 = System.currentTimeMillis();
                classScheduleRepository.saveAll(scheduleBatch);
                totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime4);
                scheduleBatch.clear();
            }

        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage());
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        long parseTime = executionTime - totalDbSaveTime;

        log.info("==== KẾT QUẢ ĐO LƯỜNG IMPORT COURSE (FULL OPTIMIZATION B2) ====");
        log.info("Tổng thời gian: {} ms", executionTime);
        log.info("- Thời gian Đọc/Xử lý dữ liệu (Parse): {} ms", parseTime);
        log.info("- Thời gian Lưu vào DB (Batch Insert): {} ms", totalDbSaveTime);
        log.info("Số lớp xử lý thành công: {}", courseCount);
        log.info("Số lịch học xử lý thành công: {}", scheduleCount);
        log.info("RAM đỉnh: {} MB", peak / (1024 * 1024));

        result.put("courseCount", courseCount);
        result.put("scheduleCount", scheduleCount);
        result.put("errorCount", errorCount);
        result.put("timeTakenMs", executionTime);
        result.put("parseTimeMs", parseTime);
        result.put("dbSaveTimeMs", totalDbSaveTime);
        result.put("memoryUsedMB", memoryUsedMB);
        
        return result;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((int) cell.getNumericCellValue());
        }
        return "";
    }

    private Integer getCellInt(Cell cell) {
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Integer.parseInt(cell.getStringCellValue().trim());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }
}
