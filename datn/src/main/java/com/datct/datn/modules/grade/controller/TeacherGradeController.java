package com.datct.datn.modules.grade.controller;

import com.datct.datn.modules.grade.DTO.GradeSubmissionResponse;
import com.datct.datn.modules.grade.DTO.StudentGradeResponse;
import com.datct.datn.modules.grade.DTO.UpdateGradeRequest;
import com.datct.datn.modules.grade.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/courses/{courseId}/grades")
@RequiredArgsConstructor
public class TeacherGradeController {

    private final GradeService gradeService;

    @GetMapping
    public ResponseEntity<List<StudentGradeResponse>> getGrades(
            @PathVariable Long courseId
    ) {
        return ResponseEntity.ok(gradeService.getGradesForCourse(courseId));
    }

    @PutMapping
    public ResponseEntity<String> updateGrades(
            @PathVariable Long courseId,
            @RequestBody List<UpdateGradeRequest> requests
    ) {
        gradeService.updateGradesForCourse(courseId, requests);
        return ResponseEntity.ok("Cập nhật điểm thành công");
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<GradeSubmissionResponse>> getSubmissions(
            @PathVariable Long courseId
    ) {
        return ResponseEntity.ok(gradeService.getSubmissionsForCourse(courseId));
    }

    @PostMapping("/submissions/midterm/submit")
    public ResponseEntity<String> submitMidtermGrades(
            @PathVariable Long courseId
    ) {
        gradeService.submitMidtermGrades(courseId);
        return ResponseEntity.ok("Đã chốt điểm giữa kỳ thành công");
    }

    @PostMapping("/submissions/final/submit")
    public ResponseEntity<String> submitFinalGrades(
            @PathVariable Long courseId
    ) {
        gradeService.submitFinalGrades(courseId);
        return ResponseEntity.ok("Đã chốt điểm cuối kỳ thành công");
    }
}
