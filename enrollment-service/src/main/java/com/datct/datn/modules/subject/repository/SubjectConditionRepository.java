package com.datct.datn.modules.subject.repository;

import com.datct.datn.modules.subject.entity.SubjectCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectConditionRepository extends JpaRepository<SubjectCondition, Long> {
    List<SubjectCondition> findBySubjectId(Long subjectId);
}
