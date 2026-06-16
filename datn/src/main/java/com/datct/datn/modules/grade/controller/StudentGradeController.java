package com.datct.datn.modules.grade.controller;

import com.datct.datn.modules.grade.DTO.StudentGradeViewResponse;
import com.datct.datn.modules.grade.DTO.TranscriptResponse;
import com.datct.datn.modules.grade.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/grades")
@RequiredArgsConstructor
public class StudentGradeController {

    private final GradeService gradeService;

    @GetMapping
    public List<StudentGradeViewResponse> getMyGrades() {
        return gradeService.getGradesForCurrentStudent();
    }

    @GetMapping("/transcript")
    public List<TranscriptResponse> getTranscript() {
        return gradeService.getTranscriptForCurrentStudent();
    }
}
