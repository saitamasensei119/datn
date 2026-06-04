package com.datct.datn.modules.student.repository;

import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository
        extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentCode(String studentCode);

    @Query("""
    SELECT s.status, COUNT(s)
    FROM Student s
    GROUP BY s.status
""")
    List<Object[]> countGroupByStatus();
    List<Student> findAll();
    Optional<Student> findByUserId(Long userId);

}
