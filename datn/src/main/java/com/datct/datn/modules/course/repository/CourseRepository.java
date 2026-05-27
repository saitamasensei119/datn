package com.datct.datn.modules.course.repository;

import com.datct.datn.modules.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository
        extends JpaRepository<Course, Long> {

    boolean existsByCourseCode(
            String courseCode
    );
}