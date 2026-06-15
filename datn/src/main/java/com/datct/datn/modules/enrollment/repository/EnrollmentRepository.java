package com.datct.datn.modules.enrollment.repository;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentIdAndCourseId(
            Long studentId,
            Long courseId
    );

    long countByCourseId(Long courseId);
    List<Enrollment> findByStudentId(Long studentId);
    @Query("""
    SELECT e.course
    FROM Enrollment e
    WHERE e.student.id = :studentId
""")
    List<Course> findCoursesByStudentId(Long studentId);

    @Query("""
    SELECT e.student
    FROM Enrollment e
    WHERE e.course.id = :courseId
""")
    List<Student> findStudentsByCourseId(Long courseId);
}