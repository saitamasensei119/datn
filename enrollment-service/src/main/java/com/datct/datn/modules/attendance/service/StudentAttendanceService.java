package com.datct.datn.modules.attendance.service;

import com.datct.datn.modules.attendance.DTO.CourseAttendanceSummaryDTO;
import com.datct.datn.modules.attendance.DTO.StudentAttendanceDetailDTO;
import com.datct.datn.modules.attendance.entity.AttendanceRecord;
import com.datct.datn.modules.attendance.repository.AttendanceRecordRepository;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentAttendanceService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Transactional(readOnly = true)
    public List<CourseAttendanceSummaryDTO> getAttendanceSummary() {
        Long userId = SecurityUtil.getCurrentUserId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        List<CourseAttendanceSummaryDTO> summaries = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            
            // Lấy tất cả record điểm danh của sinh viên này trong môn này
            List<AttendanceRecord> records = attendanceRecordRepository
                    .findByStudentIdAndAttendanceSession_CourseIdOrderByAttendanceSession_SessionDateDesc(
                            student.getId(), course.getId());

            int present = 0;
            int absent = 0;
            int late = 0;
            int excused = 0;

            for (AttendanceRecord record : records) {
                switch (record.getStatus()) {
                    case "PRESENT": present++; break;
                    case "ABSENT": absent++; break;
                    case "LATE": late++; break;
                    case "EXCUSED": excused++; break;
                }
            }

            CourseAttendanceSummaryDTO summary = CourseAttendanceSummaryDTO.builder()
                    .courseId(course.getId())
                    .courseCode(course.getCourseCode())
                    .subjectName(course.getSubject().getName())
                    .totalSessions(records.size())
                    .present(present)
                    .absent(absent)
                    .late(late)
                    .excused(excused)
                    .build();

            summaries.add(summary);
        }

        return summaries;
    }

    @Transactional(readOnly = true)
    public List<StudentAttendanceDetailDTO> getAttendanceDetails(Long courseId) {
        Long userId = SecurityUtil.getCurrentUserId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<AttendanceRecord> records = attendanceRecordRepository
                .findByStudentIdAndAttendanceSession_CourseIdOrderByAttendanceSession_SessionDateDesc(
                        student.getId(), courseId);

        List<StudentAttendanceDetailDTO> details = new ArrayList<>();
        for (AttendanceRecord record : records) {
            details.add(StudentAttendanceDetailDTO.builder()
                    .sessionId(record.getAttendanceSession().getId())
                    .sessionDate(record.getAttendanceSession().getSessionDate())
                    .status(record.getStatus())
                    .note(record.getNote())
                    .build());
        }

        return details;
    }
}
