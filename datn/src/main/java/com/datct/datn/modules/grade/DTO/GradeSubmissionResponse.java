package com.datct.datn.modules.grade.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionResponse {
    private String gradeType;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime lockedAt;
}
