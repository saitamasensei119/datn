package com.datct.datn.modules.grade.repository;

import com.datct.datn.modules.grade.entity.GradeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeSubmissionRepository extends JpaRepository<GradeSubmission, Long> {
    List<GradeSubmission> findByCourseId(Long courseId);
    Optional<GradeSubmission> findByCourseIdAndGradeType(Long courseId, String gradeType);
}
