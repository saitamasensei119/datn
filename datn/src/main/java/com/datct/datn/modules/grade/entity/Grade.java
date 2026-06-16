package com.datct.datn.modules.grade.entity;

import com.datct.datn.modules.enrollment.entity.Enrollment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;

    @Column(name = "midterm_score")
    private Double midtermScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "total_score")
    private Double totalScore;
}
