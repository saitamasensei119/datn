package com.datct.datn.modules.student.controller;

import com.datct.datn.modules.student.DTO.StudentRequest;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.DTO.StudentStatusCountResponse;
import com.datct.datn.modules.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
public class AdminStudentController {

    private final StudentService studentService;

    @GetMapping("/statistics")
    public StudentStatusCountResponse getStatistics() {
        return studentService.getStudentStatistics();
    }
    @PostMapping
    public StudentResponse create(
            @RequestBody StudentRequest request
    ) {

        return studentService.create(request);
    }
    @GetMapping("/{id}")
    public StudentResponse getById(
            @PathVariable Long id
    ) {

        return studentService.getById(id);
    }

    @GetMapping("/code/{studentCode}")
    public StudentResponse getByStudentCode(
            @PathVariable String studentCode
    ) {

        return studentService.getByStudentCode(studentCode);
    }

    @PutMapping("/{id}")
    public StudentResponse update(
            @PathVariable Long id,
            @RequestBody StudentRequest request
    ) {

        return studentService.update(id, request);
    }
    @GetMapping
    public List<StudentResponse> getAllStudents() {
        return studentService.getAllStudents();
    }
}