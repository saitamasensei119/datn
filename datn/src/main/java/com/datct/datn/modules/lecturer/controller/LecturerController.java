package com.datct.datn.modules.lecturer.controller;

import com.datct.datn.modules.lecturer.DTO.CreateLecturerRequest;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.service.LecturerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
@RequiredArgsConstructor
public class LecturerController {

    private final LecturerService lecturerService;

    @PostMapping
    public LecturerResponse create(
            @RequestBody CreateLecturerRequest request
    ) {

        return lecturerService.create(request);
    }

    @GetMapping
    public List<LecturerResponse> getAll() {

        return lecturerService.getAll();
    }

    @GetMapping("/{id}")
    public LecturerResponse getById(
            @PathVariable Long id
    ) {

        return lecturerService.getById(id);
    }

    @PutMapping("/{id}")
    public LecturerResponse update(
            @PathVariable Long id,
            @RequestBody UpdateLecturerRequest request
    ) {

        return lecturerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        lecturerService.delete(id);
    }
}
