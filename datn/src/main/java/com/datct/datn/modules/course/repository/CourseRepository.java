package com.datct.datn.modules.course.repository;

import com.datct.datn.modules.course.entity.Course;
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
}