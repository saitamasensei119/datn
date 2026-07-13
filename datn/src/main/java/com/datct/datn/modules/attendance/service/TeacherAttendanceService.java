package com.datct.datn.modules.attendance.service;

import com.datct.datn.modules.attendance.DTO.AttendanceRecordDTO;
import com.datct.datn.modules.attendance.DTO.AttendanceSessionDTO;
import com.datct.datn.modules.attendance.DTO.UpdateAttendanceRecordsRequest;
import com.datct.datn.modules.attendance.entity.AttendanceRecord;
import com.datct.datn.modules.attendance.entity.AttendanceSession;
import com.datct.datn.modules.attendance.repository.AttendanceRecordRepository;
import com.datct.datn.modules.attendance.repository.AttendanceSessionRepository;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.auth.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherAttendanceService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LecturerRepository lecturerRepository;

    private Lecturer getCurrentLecturer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        return lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private void verifyCourseOwnership(Long courseId, Lecturer lecturer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (course.getLecturer() == null || !course.getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("You do not have permission to manage this course");
        }
    }

    private AttendanceSession verifySessionOwnership(Long sessionId, Lecturer lecturer) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));
        if (session.getCourse() == null || session.getCourse().getLecturer() == null ||
                !session.getCourse().getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("You do not have permission to manage this attendance session");
        }
        return session;
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionDTO> getSessionsByCourse(Long courseId) {
        verifyCourseOwnership(courseId, getCurrentLecturer());
        return attendanceSessionRepository.findByCourseIdOrderBySessionDateDesc(courseId).stream()
                .map(this::mapToSessionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceSessionDTO getOrCreateSession(Long courseId, LocalDate date) {
        verifyCourseOwnership(courseId, getCurrentLecturer());
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Optional<AttendanceSession> sessionOpt = attendanceSessionRepository.findByCourseIdAndSessionDate(courseId, date);

        if (sessionOpt.isPresent()) {
            return mapToSessionDTO(sessionOpt.get());
        }

        // Create new session
        AttendanceSession session = AttendanceSession.builder()
                .course(course)
                .sessionDate(date)
                .records(new ArrayList<>())
                .build();

        AttendanceSession savedSession = attendanceSessionRepository.save(session);

        // Fetch enrolled students and create default PRESENT records
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<AttendanceRecord> newRecords = new ArrayList<>();

        for (Enrollment e : enrollments) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .attendanceSession(savedSession)
                    .student(e.getStudent())
                    .status("PRESENT") // Default status
                    .build();
            newRecords.add(record);
        }

        attendanceRecordRepository.saveAll(newRecords);
        savedSession.setRecords(newRecords);

        return mapToSessionDTO(savedSession);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordDTO> getRecordsBySession(Long sessionId) {
        verifySessionOwnership(sessionId, getCurrentLecturer());
        return attendanceRecordRepository.findByAttendanceSessionId(sessionId).stream()
                .map(this::mapToRecordDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateRecords(Long sessionId, UpdateAttendanceRecordsRequest request) {
        if (request == null || request.getRecords() == null || request.getRecords().isEmpty()) {
            throw new RuntimeException("Danh sách cập nhật điểm danh không được để trống");
        }

        AttendanceSession session = verifySessionOwnership(sessionId, getCurrentLecturer());
        List<String> validStatuses = List.of("PRESENT", "ABSENT", "LATE", "EXCUSED");

        for (UpdateAttendanceRecordsRequest.AttendanceRecordUpdateRequest update : request.getRecords()) {
            if (update.getRecordId() == null) {
                throw new RuntimeException("ID bản ghi điểm danh không được để trống");
            }
            if (update.getStatus() == null || !validStatuses.contains(update.getStatus())) {
                throw new RuntimeException("Trạng thái điểm danh không hợp lệ: " + update.getStatus() + ". Chỉ chấp nhận: PRESENT, ABSENT, LATE, EXCUSED");
            }

            AttendanceRecord record = attendanceRecordRepository.findById(update.getRecordId())
                    .orElseThrow(() -> new RuntimeException("Record not found: " + update.getRecordId()));

            if (!record.getAttendanceSession().getId().equals(sessionId)) {
                throw new RuntimeException("Record does not belong to session: " + update.getRecordId());
            }

            record.setStatus(update.getStatus());
            record.setNote(update.getNote());
            attendanceRecordRepository.save(record);
        }
    }

    private AttendanceSessionDTO mapToSessionDTO(AttendanceSession session) {
        return AttendanceSessionDTO.builder()
                .id(session.getId())
                .courseId(session.getCourse().getId())
                .sessionDate(session.getSessionDate())
                .note(session.getNote())
                .build();
    }

    private AttendanceRecordDTO mapToRecordDTO(AttendanceRecord record) {
        return AttendanceRecordDTO.builder()
                .id(record.getId())
                .attendanceSessionId(record.getAttendanceSession().getId())
                .studentId(record.getStudent().getId())
                .studentCode(record.getStudent().getStudentCode())
                .studentName(record.getStudent().getUser().getFullName())
                .status(record.getStatus())
                .note(record.getNote())
                .build();
    }
}
