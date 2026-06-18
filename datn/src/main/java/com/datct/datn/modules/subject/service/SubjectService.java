package com.datct.datn.modules.subject.service;

import com.datct.datn.modules.subject.DTO.CreateSubjectRequest;
import com.datct.datn.modules.subject.DTO.SubjectResponse;
import com.datct.datn.modules.subject.DTO.UpdateSubjectRequest;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    private final DepartmentRepository departmentRepository;

    public SubjectResponse create(
            CreateSubjectRequest request
    ) {

        boolean exists =
                subjectRepository
                        .existsBySubjectCode(
                                request.getSubjectCode()
                        );

        if (exists) {
            throw new RuntimeException(
                    "Subject code already exists"
            );
        }

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Department not found"
                        )
                );

        Subject subject = new Subject();

        subject.setSubjectCode(
                request.getSubjectCode()
        );

        subject.setName(
                request.getName()
        );

        subject.setCredits(
                request.getCredits()
        );

        subject.setDepartment(department);
        subject.setEnglishName(request.getEnglishName());
        subject.setSubjectType(request.getSubjectType());
        subject.setLabRequirement(request.getLabRequirement());
        subject.setProgramCode(request.getProgramCode());
        subject.setNote(request.getNote());
        subject.setManagementCode(request.getManagementCode() != null ? request.getManagementCode() : "");

        Subject saved =
                subjectRepository.save(subject);

        return mapToResponse(saved);
    }

    public List<SubjectResponse> getAll() {

        return subjectRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Page<SubjectResponse> getPaginated(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Subject> subjectPage;

        if (search != null && !search.trim().isEmpty()) {
            subjectPage = subjectRepository.findBySubjectCodeContainingIgnoreCaseOrNameContainingIgnoreCase(search, search, pageable);
        } else {
            subjectPage = subjectRepository.findAll(pageable);
        }

        return subjectPage.map(this::mapToResponse);
    }

    public SubjectResponse getById(Long id) {

        Subject subject =
                subjectRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Subject not found"
                                )
                        );

        return mapToResponse(subject);
    }

    public SubjectResponse update(
            Long id,
            UpdateSubjectRequest request
    ) {

        Subject subject =
                subjectRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Subject not found"
                                )
                        );

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Department not found"
                        )
                );

        subject.setSubjectCode(
                request.getSubjectCode()
        );

        subject.setName(
                request.getName()
        );

        subject.setCredits(
                request.getCredits()
        );

        subject.setDepartment(department);
        subject.setEnglishName(request.getEnglishName());
        subject.setSubjectType(request.getSubjectType());
        subject.setLabRequirement(request.getLabRequirement());
        subject.setProgramCode(request.getProgramCode());
        subject.setNote(request.getNote());
        subject.setManagementCode(request.getManagementCode() != null ? request.getManagementCode() : "");

        Subject updated =
                subjectRepository.save(subject);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        subjectRepository.deleteById(id);
    }

    private SubjectResponse mapToResponse(
            Subject subject
    ) {

        return new SubjectResponse(
                subject.getId(),
                subject.getSubjectCode(),
                subject.getName(),
                subject.getCredits(),
                subject.getDepartment() != null
                        ? subject.getDepartment().getId()
                        : null,
                subject.getDepartment() != null
                        ? subject.getDepartment().getName()
                        : null,
                subject.getEnglishName(),
                subject.getSubjectType(),
                subject.getLabRequirement(),
                subject.getProgramCode(),
                subject.getNote(),
                subject.getManagementCode()
        );
    }
}
