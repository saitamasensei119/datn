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

    @Transactional(readOnly = true)
    public List<AttendanceSessionDTO> getSessionsByCourse(Long courseId) {
        return attendanceSessionRepository.findByCourseIdOrderBySessionDateDesc(courseId).stream()
                .map(this::mapToSessionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceSessionDTO getOrCreateSession(Long courseId, LocalDate date) {
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
        return attendanceRecordRepository.findByAttendanceSessionId(sessionId).stream()
                .map(this::mapToRecordDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateRecords(Long sessionId, UpdateAttendanceRecordsRequest request) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        for (UpdateAttendanceRecordsRequest.AttendanceRecordUpdateRequest update : request.getRecords()) {
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
