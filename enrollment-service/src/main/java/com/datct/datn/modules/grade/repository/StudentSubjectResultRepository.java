package com.datct.datn.modules.grade.repository;

import com.datct.datn.modules.grade.entity.StudentSubjectResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubjectResultRepository extends JpaRepository<StudentSubjectResult, Long> {
    Optional<StudentSubjectResult> findByStudentIdAndSubjectId(Long studentId, Long subjectId);
    List<StudentSubjectResult> findByStudentIdAndSubjectIdIn(Long studentId, java.util.Collection<Long> subjectIds);
    List<StudentSubjectResult> findByStudentId(Long studentId);
}
