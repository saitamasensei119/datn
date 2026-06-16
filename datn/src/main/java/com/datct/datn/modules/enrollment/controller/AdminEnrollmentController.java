package com.datct.datn.modules.enrollment.controller;

import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<String> enroll(
            @RequestBody EnrollmentRequest request
    ) {

        enrollmentService.enroll(request);

        return ResponseEntity.ok(
                "Enroll success"
        );
    }

    @DeleteMapping
    public ResponseEntity<String> unenroll(
            @RequestBody EnrollmentRequest request
    ) {
        enrollmentService.unenrollByAdmin(request.getStudentId(), request.getCourseId());
        return ResponseEntity.ok("Unenrolled successfully");
    }
}
