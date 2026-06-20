package com.datct.datn.modules.course.service;

import com.datct.datn.modules.course.DTO.CreateSemesterRequest;
import com.datct.datn.modules.course.DTO.SemesterResponse;
import com.datct.datn.modules.course.DTO.UpdateSemesterRequest;
import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;

    public SemesterResponse create(
            CreateSemesterRequest request
    ) {

        Semester semester = new Semester();

        semester.setName(
                request.getName()
        );

        semester.setStartDate(
                request.getStartDate()
        );

        semester.setEndDate(
                request.getEndDate()
        );

        if (request.getStatus() != null) {
            semester.setStatus(request.getStatus());
        }

        Semester saved =
                semesterRepository.save(semester);

        return mapToResponse(saved);
    }

    public List<SemesterResponse> getAll() {

        return semesterRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SemesterResponse getById(Long id) {

        Semester semester =
                semesterRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Semester not found"
                                )
                        );

        return mapToResponse(semester);
    }

    public SemesterResponse update(
            Long id,
            UpdateSemesterRequest request
    ) {

        Semester semester =
                semesterRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Semester not found"
                                )
                        );

        semester.setName(
                request.getName()
        );

        semester.setStartDate(
                request.getStartDate()
        );

        semester.setEndDate(
                request.getEndDate()
        );

        if (request.getStatus() != null) {
            semester.setStatus(request.getStatus());
        }

        Semester updated =
                semesterRepository.save(semester);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        semesterRepository.deleteById(id);
    }

    private SemesterResponse mapToResponse(
            Semester semester
    ) {

        return new SemesterResponse(
                semester.getId(),
                semester.getName(),
                semester.getStartDate(),
                semester.getEndDate(),
                semester.getStatus()
        );
    }
}