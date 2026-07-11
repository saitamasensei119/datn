package com.datct.datn.modules.enrollment.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreRegistrationResponse {
    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Long semesterId;
    private LocalDateTime createdAt;
}
