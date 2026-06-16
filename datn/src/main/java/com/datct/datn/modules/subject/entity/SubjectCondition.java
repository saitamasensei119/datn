package com.datct.datn.modules.subject.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subject_conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "required_subject_id", nullable = false)
    private Subject requiredSubject;

    @Column(name = "condition_type", nullable = false, length = 50)
    private String conditionType;
}
