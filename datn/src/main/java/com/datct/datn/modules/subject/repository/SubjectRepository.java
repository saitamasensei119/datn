package com.datct.datn.modules.subject.repository;

import com.datct.datn.modules.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    boolean existsBySubjectCode(
            String subjectCode
    );
}