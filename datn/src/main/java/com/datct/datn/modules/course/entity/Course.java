package com.datct.datn.modules.course.entity;

import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code",
            nullable = false,
            unique = true)
    private String courseCode;

    @Column(name = "max_students",
            nullable = false)
    private Integer maxStudents;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id",
            nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id")
    private Lecturer lecturer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id",
            nullable = false)
    private Semester semester;

    @Enumerated(EnumType.STRING)
    private CourseStatus status = CourseStatus.PLANNED;

    @Column(name = "week_pattern")
    private String weekPattern;

    @Column(name = "opening_batch", nullable = false)
    private String openingBatch;

    @OneToOne(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private com.datct.datn.modules.grade.entity.GradeComponent gradeComponent;
}
