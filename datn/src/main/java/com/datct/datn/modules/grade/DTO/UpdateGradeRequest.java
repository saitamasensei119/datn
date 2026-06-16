package com.datct.datn.modules.grade.DTO;

import lombok.Data;

@Data
public class UpdateGradeRequest {
    private Long enrollmentId;
    private Double midtermScore;
    private Double finalScore;
}
