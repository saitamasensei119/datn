package com.datct.datn.modules.grade.entity;

import com.datct.datn.modules.course.entity.Course;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "grade_components")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;

    @Column(name = "midterm_weight", nullable = false)
    private Double midtermWeight;
}
