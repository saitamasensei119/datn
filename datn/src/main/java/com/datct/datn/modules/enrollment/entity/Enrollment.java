package com.datct.datn.modules.enrollment.entity;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.student.entity.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "enrollments",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"student_id", "course_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private LocalDateTime enrolledAt;

    @OneToOne(mappedBy = "enrollment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private com.datct.datn.modules.grade.entity.Grade grade;
}
