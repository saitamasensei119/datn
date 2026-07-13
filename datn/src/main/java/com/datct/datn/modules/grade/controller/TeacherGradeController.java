package com.datct.datn.modules.grade.controller;

import com.datct.datn.modules.grade.DTO.GradeSubmissionResponse;
import com.datct.datn.modules.grade.DTO.StudentGradeResponse;
import com.datct.datn.modules.grade.DTO.UpdateGradeRequest;
import com.datct.datn.modules.grade.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/courses/{courseId}/grades")
@RequiredArgsConstructor
@Validated
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
            @RequestBody @Valid List<UpdateGradeRequest> requests
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

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long courseId) {
        byte[] excelContent = gradeService.generateGradeTemplate(courseId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "grades_template_course_" + courseId + ".xlsx");
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelContent);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadGrades(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file
    ) {
        gradeService.importGradesFromExcel(courseId, file);
        return ResponseEntity.ok("Nhập điểm từ file Excel thành công");
    }
}
