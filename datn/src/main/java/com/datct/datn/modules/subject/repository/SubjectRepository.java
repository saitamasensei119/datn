package com.datct.datn.modules.subject.repository;

import com.datct.datn.modules.subject.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    boolean existsBySubjectCode(
            String subjectCode
    );

    java.util.Optional<Subject> findBySubjectCode(String subjectCode);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department"})
    java.util.List<Subject> findAll();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department"})
    Page<Subject> findAll(Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department"})
    Page<Subject> findBySubjectCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String subjectCode,
            String name,
            Pageable pageable
    );
}