package com.datct.datn.modules.grade.repository;

import com.datct.datn.modules.grade.entity.GradeComponent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GradeComponentRepository extends JpaRepository<GradeComponent, Long> {
    Optional<GradeComponent> findByCourseId(Long courseId);
}
