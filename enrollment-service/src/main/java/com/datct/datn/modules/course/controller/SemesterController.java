package com.datct.datn.modules.course.controller;

import com.datct.datn.modules.course.DTO.CreateSemesterRequest;
import com.datct.datn.modules.course.DTO.SemesterResponse;
import com.datct.datn.modules.course.DTO.UpdateSemesterRequest;
import com.datct.datn.modules.course.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    public SemesterResponse create(
            @RequestBody CreateSemesterRequest request
    ) {

        return semesterService.create(request);
    }

    @GetMapping
    public List<SemesterResponse> getAll() {

        return semesterService.getAll();
    }

    @GetMapping("/{id}")
    public SemesterResponse getById(
            @PathVariable Long id
    ) {

        return semesterService.getById(id);
    }

    @PutMapping("/{id}")
    public SemesterResponse update(
            @PathVariable Long id,
            @RequestBody UpdateSemesterRequest request
    ) {

        return semesterService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        semesterService.delete(id);
    }
}
