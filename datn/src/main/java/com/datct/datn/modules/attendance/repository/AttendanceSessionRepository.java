package com.datct.datn.modules.attendance.repository;

import com.datct.datn.modules.attendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByCourseIdOrderBySessionDateDesc(Long courseId);
    Optional<AttendanceSession> findByCourseIdAndSessionDate(Long courseId, LocalDate sessionDate);
}
