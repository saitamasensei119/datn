package com.datct.datn.modules.lecturer.controller;

import com.datct.datn.modules.lecturer.DTO.CreateLecturerRequest;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.service.LecturerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/lecturers")
@RequiredArgsConstructor
public class AdminLecturerController {
    private final LecturerService lecturerService;

    @PostMapping
    public LecturerResponse createLecturer(
            @RequestBody
            CreateLecturerRequest request
    ) {

        return lecturerService
                .createLecturer(request);
    }

    @PutMapping("/{id}")
    public LecturerResponse update(
            @PathVariable Long id,
            @RequestBody UpdateLecturerRequest request
    ) {

        return lecturerService.update(id, request);
    }

    // Lấy tất cả giảng viên
    @GetMapping
    public ResponseEntity<List<LecturerResponse>> getAllLecturers() {
        List<LecturerResponse> lecturers = lecturerService.getAll();
        return ResponseEntity.ok(lecturers);
    }

    // Lấy giảng viên theo ID
    @GetMapping("/{id}")
    public ResponseEntity<LecturerResponse> getLecturerById(@PathVariable Long id) {
        LecturerResponse lecturer = lecturerService.getById(id);
        return ResponseEntity.ok(lecturer);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countLecturers() {
        return ResponseEntity.ok(
                lecturerService.countLecturers()
        );
    }
}
