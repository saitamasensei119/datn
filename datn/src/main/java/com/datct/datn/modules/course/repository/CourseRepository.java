package com.datct.datn.modules.course.repository;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository
        extends JpaRepository<Course, Long> {

    boolean existsByCourseCode(
            String courseCode
    );
    List<Course> findByLecturerId(Long lecturerId);
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
}