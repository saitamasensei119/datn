package com.datct.datn.modules.enrollment.controller;

import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.datct.datn.modules.enrollment.service.EnrollmentProducer;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;
    private final EnrollmentProducer enrollmentProducer;

    @PostMapping
    public ResponseEntity<String> enroll(
            @RequestBody EnrollmentRequest request
    ) {
        enrollmentService.enroll(request);
        return ResponseEntity.ok("Enroll success");
    }

    @PostMapping("/async")
    public ResponseEntity<String> enrollAsync(
            @RequestBody EnrollmentRequest request
    ) {
        enrollmentProducer.sendEnrollmentRequest(request.getStudentId(), request.getCourseId(), request.isIgnoreWarning());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body("Đơn đăng ký đang được xử lý (RabbitMQ)");
    }

    @DeleteMapping
    public ResponseEntity<String> unenroll(
            @RequestBody EnrollmentRequest request
    ) {
        enrollmentService.unenrollByAdmin(request.getStudentId(), request.getCourseId());
        return ResponseEntity.ok("Unenrolled successfully");
    }
}
