package com.datct.datn.modules.subject.controller;

import com.datct.datn.modules.subject.DTO.CreateSubjectRequest;
import com.datct.datn.modules.subject.DTO.SubjectResponse;
import com.datct.datn.modules.subject.DTO.UpdateSubjectRequest;
import com.datct.datn.modules.subject.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;
    private final com.datct.datn.modules.subject.service.SubjectImportService subjectImportService;

    @PostMapping("/import")
    public java.util.Map<String, Object> importExcel(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return subjectImportService.importExcel(file);
    }

    @PostMapping
    public SubjectResponse create(
            @RequestBody CreateSubjectRequest request
    ) {

        return subjectService.create(request);
    }

    @GetMapping
    public List<SubjectResponse> getAll() {

        return subjectService.getAll();
    }

    @GetMapping("/{id}")
    public SubjectResponse getById(
            @PathVariable Long id
    ) {

        return subjectService.getById(id);
    }

    @PutMapping("/{id}")
    public SubjectResponse update(
            @PathVariable Long id,
            @RequestBody UpdateSubjectRequest request
    ) {

        return subjectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        subjectService.delete(id);
    }
}
