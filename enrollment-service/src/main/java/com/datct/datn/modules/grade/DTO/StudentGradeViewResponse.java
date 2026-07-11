package com.datct.datn.modules.grade.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentGradeViewResponse {
    private Long courseId;
    private String courseCode;
    private String subjectName;
    private Integer credits;
    private Double midtermScore;
    private String midtermStatus;
    private Double finalScore;
    private String finalStatus;
    private Double totalScore;
    private String status;
}
