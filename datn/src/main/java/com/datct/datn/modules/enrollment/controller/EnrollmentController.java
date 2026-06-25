package com.datct.datn.modules.enrollment.controller;

import com.datct.datn.modules.course.DTO.SemesterResponse;
import com.datct.datn.modules.course.DTO.StudentCourseResponse;
import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.datct.datn.modules.enrollment.service.EnrollmentProducer;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/student/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final EnrollmentProducer enrollmentProducer;

    @PostMapping
    public ResponseEntity<String> enroll(
            @RequestBody EnrollmentRequest request
    ) {
        Long studentId = enrollmentService.getCurrentStudentId();
        
        // Push to RabbitMQ and return 202 Accepted
        enrollmentProducer.sendEnrollmentRequest(studentId, request.getCourseId(), request.isIgnoreWarning());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
                "Đơn đăng ký đang được xử lý"
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
