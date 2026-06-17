package com.datct.datn.modules.subject.entity;

import com.datct.datn.modules.user.entity.Department;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject_code",
            nullable = false,
            unique = true)
    private String subjectCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer credits;

    @Column(name = "english_name")
    private String englishName;

    @Column(name = "subject_type", nullable = false)
    private String subjectType;

    @Column(name = "lab_requirement")
    private String labRequirement;

    @Column(name = "program_code")
    private String programCode;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "management_code", nullable = false)
    private String managementCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
}
