package com.datct.datn.modules.course.repository;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface CourseRepository
        extends JpaRepository<Course, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithPessimisticLock(@Param("id") Long id);

    boolean existsByCourseCode(
            String courseCode
    );
    List<Course> findByLecturerId(Long lecturerId);
    List<Course> findByCourseCodeContainingIgnoreCase(String courseCode);
    Page<Course> findByCourseCodeContainingIgnoreCaseOrSubject_NameContainingIgnoreCase(
            String courseCode,
            String subjectName,
            Pageable pageable
    );
    Page<Course> findByStatus(
            CourseStatus status,
            Pageable pageable
    );
    Page<Course> findByStatusAndCourseCodeContainingIgnoreCase(
            CourseStatus status,
            String courseCode,
            Pageable pageable
    );

    Page<Course> findByStatusAndSubject_SubjectCodeContainingIgnoreCase(
            CourseStatus status,
            String subjectCode,
            Pageable pageable
    );

    Page<Course> findByStatusAndSubject_NameContainingIgnoreCase(
            CourseStatus status,
            String name,
            Pageable pageable
    );

    List<Course> findBySemesterIdAndStatus(Long semesterId, CourseStatus status);
}