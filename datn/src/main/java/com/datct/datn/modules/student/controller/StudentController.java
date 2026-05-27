package com.datct.datn.modules.student.controller;

import com.datct.datn.modules.student.DTO.StudentRequest;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public StudentResponse create(
            @RequestBody StudentRequest request
    ) {

        return studentService.create(request);
    }

//    @GetMapping
//    public List<StudentResponse> getAll() {
//
//        return studentService.getAll();
//    }

    @GetMapping("/{id}")
    public StudentResponse getById(
            @PathVariable Long id
    ) {

        return studentService.getById(id);
    }

    @PutMapping("/{id}")
    public StudentResponse update(
            @PathVariable Long id,
            @RequestBody StudentRequest request
    ) {

        return studentService.update(id, request);
    }

//    @DeleteMapping("/{id}")
//    public void delete(
//            @PathVariable Long id
//    ) {
//
//        studentService.delete(id);
//    }
}