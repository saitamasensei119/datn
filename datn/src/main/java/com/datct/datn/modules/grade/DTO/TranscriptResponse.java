package com.datct.datn.modules.grade.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptResponse {
    private String semesterName;
    private String courseCode;
    private String subjectName;
    private Integer credits;
    private Double totalScore;
    private Double gradePoint;
    private String letterGrade;
    private Boolean isPassed;
}
