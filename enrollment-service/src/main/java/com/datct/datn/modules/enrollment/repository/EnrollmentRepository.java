package com.datct.datn.modules.enrollment.repository;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentIdAndCourseId(
            Long studentId,
            Long courseId
    );

    Optional<Enrollment> findByStudentIdAndCourseId(
            Long studentId,
            Long courseId
    );

    @Query("""
        SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
        FROM Enrollment e
        WHERE e.student.id = :studentId
          AND e.course.subject.id = :subjectId
          AND e.course.semester.id = :semesterId
    """)
    boolean existsByStudentIdAndSubjectIdAndSemesterId(
            @org.springframework.data.repository.query.Param("studentId") Long studentId,
            @org.springframework.data.repository.query.Param("subjectId") Long subjectId,
            @org.springframework.data.repository.query.Param("semesterId") Long semesterId
    );

    @Query("""
        SELECT COALESCE(SUM(e.course.subject.credits), 0)
        FROM Enrollment e
        WHERE e.student.id = :studentId
          AND e.course.semester.id = :semesterId
    """)
    Integer sumCreditsByStudentIdAndSemesterId(
            @org.springframework.data.repository.query.Param("studentId") Long studentId,
            @org.springframework.data.repository.query.Param("semesterId") Long semesterId
    );

    long countByCourseId(Long courseId);
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
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

    @Query("""
    SELECT e.student
    FROM Enrollment e
    WHERE e.course.id = :courseId
      AND LOWER(e.student.studentCode) LIKE LOWER(CONCAT('%', :studentCode, '%'))
""")
    List<Student> searchStudentsByCourseIdAndStudentCode(
            @org.springframework.data.repository.query.Param("courseId") Long courseId,
            @org.springframework.data.repository.query.Param("studentCode") String studentCode
    );
}