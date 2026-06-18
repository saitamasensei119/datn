package com.datct.datn.modules.enrollment.repository;

import com.datct.datn.modules.enrollment.entity.PreRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreRegistrationRepository extends JpaRepository<PreRegistration, Long> {
    
    List<PreRegistration> findByStudentIdAndSemesterId(Long studentId, Long semesterId);
    
    Optional<PreRegistration> findByStudentIdAndSubjectIdAndSemesterId(Long studentId, Long subjectId, Long semesterId);

    @Query("SELECT COALESCE(SUM(pr.subject.credits), 0) FROM PreRegistration pr WHERE pr.student.id = :studentId AND pr.semester.id = :semesterId")
    Integer sumCreditsByStudentIdAndSemesterId(Long studentId, Long semesterId);
}
