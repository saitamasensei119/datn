package com.datct.datn.modules.grade.entity;

import com.datct.datn.modules.course.entity.Course;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "grade_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "grade_type", nullable = false)
    private String gradeType; // MIDTERM, FINAL

    @Builder.Default
    @Column(nullable = false)
    private String status = "NOT_SUBMITTED"; // NOT_SUBMITTED, SUBMITTED

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;
}
