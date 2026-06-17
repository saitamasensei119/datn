package com.datct.datn.modules.attendance.repository;

import com.datct.datn.modules.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByAttendanceSessionId(Long sessionId);
    Optional<AttendanceRecord> findByAttendanceSessionIdAndStudentId(Long sessionId, Long studentId);
    List<AttendanceRecord> findByStudentIdAndAttendanceSession_CourseIdOrderByAttendanceSession_SessionDateDesc(Long studentId, Long courseId);
}
