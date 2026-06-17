package com.datct.datn.modules.subject.service;

import com.datct.datn.modules.subject.DTO.CreateSubjectConditionRequest;
import com.datct.datn.modules.subject.DTO.SubjectConditionDTO;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.entity.SubjectCondition;
import com.datct.datn.modules.subject.repository.SubjectConditionRepository;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectConditionService {

    private final SubjectConditionRepository subjectConditionRepository;
    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectConditionDTO> getConditionsForSubject(Long subjectId) {
        return subjectConditionRepository.findBySubjectId(subjectId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public SubjectConditionDTO addCondition(Long subjectId, CreateSubjectConditionRequest request) {
        if (subjectId.equals(request.getRequiredSubjectId())) {
            throw new RuntimeException("Môn học không thể tự làm điều kiện cho chính nó.");
        }

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Subject requiredSubject = subjectRepository.findById(request.getRequiredSubjectId())
                .orElseThrow(() -> new RuntimeException("Required subject not found"));

        // Kiểm tra xem đã tồn tại điều kiện này chưa
        boolean exists = subjectConditionRepository.findBySubjectId(subjectId).stream()
                .anyMatch(c -> c.getRequiredSubject().getId().equals(request.getRequiredSubjectId()) 
                            && c.getConditionType().equals(request.getConditionType()));
        
        if (exists) {
            throw new RuntimeException("Điều kiện này đã tồn tại cho môn học này.");
        }

        SubjectCondition condition = SubjectCondition.builder()
                .subject(subject)
                .requiredSubject(requiredSubject)
                .conditionType(request.getConditionType())
                .build();

        SubjectCondition saved = subjectConditionRepository.save(condition);
        return mapToDTO(saved);
    }

    @Transactional
    public void removeCondition(Long subjectId, Long conditionId) {
        SubjectCondition condition = subjectConditionRepository.findById(conditionId)
                .orElseThrow(() -> new RuntimeException("Condition not found"));
        
        if (!condition.getSubject().getId().equals(subjectId)) {
            throw new RuntimeException("Condition does not belong to this subject");
        }

        subjectConditionRepository.delete(condition);
    }

    private SubjectConditionDTO mapToDTO(SubjectCondition condition) {
        return SubjectConditionDTO.builder()
                .id(condition.getId())
                .subjectId(condition.getSubject().getId())
                .requiredSubjectId(condition.getRequiredSubject().getId())
                .requiredSubjectCode(condition.getRequiredSubject().getSubjectCode())
                .requiredSubjectName(condition.getRequiredSubject().getName())
                .conditionType(condition.getConditionType())
                .build();
    }
}
