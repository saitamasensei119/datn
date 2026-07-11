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

    @org.springframework.data.jpa.repository.Query("SELECT new com.datct.datn.modules.subject.DTO.SubjectSimpleResponse(s.id, s.subjectCode, s.name) FROM Subject s WHERE LOWER(s.subjectCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    java.util.List<com.datct.datn.modules.subject.DTO.SubjectSimpleResponse> searchSimple(@org.springframework.data.repository.query.Param("keyword") String keyword, Pageable pageable);
}