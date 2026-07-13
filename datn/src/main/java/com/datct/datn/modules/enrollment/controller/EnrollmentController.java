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
import com.datct.datn.modules.enrollment.service.RedisSlotService;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/student/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final EnrollmentProducer enrollmentProducer;
    private final RedisSlotService redisSlotService;

    @PostMapping
    public ResponseEntity<String> enroll(
            @RequestBody EnrollmentRequest request
    ) {
        Long studentId = enrollmentService.getCurrentStudentId();

        // 1. Kiểm tra Lính gác Tầng 2 (Khóa chống bấm đúp 3s & Giới hạn tần suất 5 req/5s)
        RedisSlotService.AntiSpamResult antiSpamResult = redisSlotService.checkAntiSpamAndLock(studentId, request.getCourseId());
        if (antiSpamResult == RedisSlotService.AntiSpamResult.SPAM_LOCKED) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    "Bạn vừa gửi yêu cầu đăng ký môn học này rồi! Vui lòng đợi 3 giây trước khi thao tác lại."
            );
        } else if (antiSpamResult == RedisSlotService.AntiSpamResult.RATE_LIMITED) {
            // Vi phạm tần suất -> Ghi nhận vi phạm, nếu đủ 10 lần -> khóa tài khoản 5 phút (300 giây)
            redisSlotService.triggerViolation(studentId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    "Bạn đang thao tác quá nhanh! Vui lòng đợi 5 giây trước khi tiếp tục đăng ký."
            );
        }

        // 2. Kiểm tra & Khước từ tiền đồn tại Redis (Fast Rejection) trước khi đẩy vào RabbitMQ
        if (!redisSlotService.tryAcquireSlot(request.getCourseId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    "Lớp học phần đã đầy! (Khước từ tại cổng Redis API Gateway)"
            );
        }

        // 3. Push to RabbitMQ and return 202 Accepted
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
