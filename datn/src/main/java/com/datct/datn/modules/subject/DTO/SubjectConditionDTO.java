package com.datct.datn.modules.subject.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectConditionDTO {
    private Long id;
    private Long subjectId;
    private Long requiredSubjectId;
    private String requiredSubjectCode;
    private String requiredSubjectName;
    private String conditionType;
}
