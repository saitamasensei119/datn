package com.datct.datn.modules.student.controller;

import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.student.DTO.StudentRequest;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    @GetMapping("/me")
    public StudentResponse getMyProfile() {

        return studentService.getMyProfile();
    }

    @PutMapping("/me")
    public StudentResponse updateMyProfile(
            @RequestBody
            StudentRequest request
    ) {

        return studentService
                .updateMyProfile(request);
    }





}