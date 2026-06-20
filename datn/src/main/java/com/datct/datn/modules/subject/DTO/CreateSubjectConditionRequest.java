package com.datct.datn.modules.subject.DTO;

import com.datct.datn.modules.subject.entity.ConditionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubjectConditionRequest {
    private Long requiredSubjectId;
    private ConditionType conditionType;
}
