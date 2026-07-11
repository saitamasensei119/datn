package com.datct.datn.modules.subject.controller;

import com.datct.datn.modules.subject.DTO.CreateSubjectConditionRequest;
import com.datct.datn.modules.subject.DTO.SubjectConditionDTO;
import com.datct.datn.modules.subject.service.SubjectConditionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects/{subjectId}/conditions")
@RequiredArgsConstructor
public class SubjectConditionController {

    private final SubjectConditionService subjectConditionService;

    @GetMapping
    public List<SubjectConditionDTO> getConditions(@PathVariable Long subjectId) {
        return subjectConditionService.getConditionsForSubject(subjectId);
    }

    @PostMapping
    public SubjectConditionDTO addCondition(
            @PathVariable Long subjectId,
            @RequestBody CreateSubjectConditionRequest request) {
        return subjectConditionService.addCondition(subjectId, request);
    }

    @DeleteMapping("/{conditionId}")
    public void removeCondition(
            @PathVariable Long subjectId,
            @PathVariable Long conditionId) {
        subjectConditionService.removeCondition(subjectId, conditionId);
    }
}
