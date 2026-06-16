package com.datct.datn.modules.grade.entity;

import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_subject_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubjectResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "best_attempt_enrollment_id")
    private Enrollment bestAttemptEnrollment;

    @Column(name = "final_score", nullable = false)
    private Double finalScore;

    @Column(name = "letter_grade", length = 2)
    private String letterGrade;

    @Column(name = "grade_point")
    private Double gradePoint;

    @Column(name = "is_passed", nullable = false)
    private Boolean isPassed;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
