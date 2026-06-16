package com.datct.datn.modules.enrollment.controller;

import com.datct.datn.modules.course.DTO.SemesterResponse;
import com.datct.datn.modules.course.DTO.StudentCourseResponse;
import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<String> enroll(
            @RequestBody EnrollmentRequest request
    ) {

        enrollmentService.studentEnroll(request);

        return ResponseEntity.ok(
                "Enroll success"
        );
    }
    @GetMapping
    public List<StudentCourseResponse> getStudentEnroll() {

        return enrollmentService.getStudentEnroll();
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<String> unenroll(
            @PathVariable Long courseId
    ) {
        enrollmentService.unenroll(courseId);
        return ResponseEntity.ok("Unenrolled successfully");
    }
}
