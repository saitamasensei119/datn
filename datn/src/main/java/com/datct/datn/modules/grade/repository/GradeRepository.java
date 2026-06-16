package com.datct.datn.modules.grade.repository;

import com.datct.datn.modules.grade.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {

    @Query("SELECT g FROM Grade g WHERE g.enrollment.course.id = :courseId")
    List<Grade> findByCourseId(@Param("courseId") Long courseId);

    Optional<Grade> findByEnrollmentId(Long enrollmentId);
}
