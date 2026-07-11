package com.datct.datn.modules.grade.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGradeResponse {
    private Long enrollmentId;
    private String studentCode;
    private String fullName;
    private Double midtermScore;
    private Double finalScore;
    private Double totalScore;
}
