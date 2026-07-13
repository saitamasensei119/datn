package com.datct.datn.modules.enrollment.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisSlotService {

    private final StringRedisTemplate redisTemplate;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final String SLOT_KEY_PREFIX = "course:slots:";
    private static final String LOCK_KEY_PREFIX = "enroll:lock:";
    private static final String RATELIMIT_KEY_PREFIX = "enroll:ratelimit:";
    private static final String VIOLATION_KEY_PREFIX = "enroll:violations:";
    private static final String BLOCKED_KEY_PREFIX = "enroll:blocked:";

    public enum AntiSpamResult {
        OK,
        SPAM_LOCKED,
        RATE_LIMITED
    }

    /**
     * Kiểm tra xem tài khoản của sinh viên có đang bị KHÓA TẠM THỜI (5 phút) do dùng Tool spam hay không.
     */
    public boolean isBlocked(Long studentId) {
        if (studentId == null) return false;
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLOCKED_KEY_PREFIX + studentId));
    }

    /**
     * Lính gác Tầng 2: Kiểm tra chống gửi đúp cho cùng môn học (3 giây)
     * và kiểm tra giới hạn tần suất chung (<= 5 request / 5 giây).
     */
    public AntiSpamResult checkAntiSpamAndLock(Long studentId, Long courseId) {
        if (studentId == null || courseId == null) return AntiSpamResult.OK;

        // 1. Khóa chống bấm đúp cùng 1 môn học (Idempotency Lock SETNX trong 3 giây)
        String lockKey = LOCK_KEY_PREFIX + studentId + ":" + courseId;
        Boolean acquiredLock = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(3));
        if (acquiredLock == null || !acquiredLock) {
            log.warn("Spam Lock Triggered: Student {} double-clicked or spammed Course {} within 3s", studentId, courseId);
            return AntiSpamResult.SPAM_LOCKED;
        }

        // 2. Giới hạn tần suất chung cho sinh viên (Global Cooldown: max 5 request trong 5 giây)
        String rateLimitKey = RATELIMIT_KEY_PREFIX + studentId;
        Long currentRequests = redisTemplate.opsForValue().increment(rateLimitKey);
        if (currentRequests != null && currentRequests == 1) {
            redisTemplate.expire(rateLimitKey, 5, TimeUnit.SECONDS);
        }

        if (currentRequests != null && currentRequests > 5) {
            log.warn("Rate Limit Triggered: Student {} exceeded 5 requests in 5s (count={})", studentId, currentRequests);
            return AntiSpamResult.RATE_LIMITED;
        }

        return AntiSpamResult.OK;
    }

    /**
     * Lính gác Tầng 3: Ghi nhận 1 lần vi phạm tần suất.
     * Nếu vi phạm >= 10 lần trong 1 phút -> Khóa tài khoản trong 5 phút (300 giây)!
     */
    public void triggerViolation(Long studentId) {
        if (studentId == null) return;
        String violationKey = VIOLATION_KEY_PREFIX + studentId;
        Long violations = redisTemplate.opsForValue().increment(violationKey);
        if (violations != null && violations == 1) {
            redisTemplate.expire(violationKey, 60, TimeUnit.SECONDS);
        }

        if (violations != null && violations >= 10) {
            String blockedKey = BLOCKED_KEY_PREFIX + studentId;
            redisTemplate.opsForValue().set(blockedKey, "SPAM_BLOCKED", 300, TimeUnit.SECONDS);
            log.error("SECURITY ALERT: Student {} triggered {} rate limit violations in 1 minute -> BLOCKED FOR 5 MINUTES (300s)!", studentId, violations);
        }
    }

    /**
     * Lính gác Tiền đồn tại API Gateway (Port 8080):
     * Thực hiện kiểm tra & đếm ngược nguyên tử (Atomic Decrement) trên RAM của Redis.
     * Nếu lớp đã đầy, trả về false ngay trong 1 mili-giây mà không đẩy vào RabbitMQ.
     */
    public boolean tryAcquireSlot(Long courseId) {
        String key = SLOT_KEY_PREFIX + courseId;

        // Nếu key chưa tồn tại trên Redis (Cache Miss), tải sĩ số thực tế từ PostgreSQL lên Redis
        if (!Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));
            long currentEnrolled = enrollmentRepository.countByCourseId(courseId);
            long remainingSlots = course.getMaxStudents() - currentEnrolled;

            // Khởi tạo số lượng chỗ trống lên Redis
            redisTemplate.opsForValue().set(key, String.valueOf(remainingSlots));
            log.info("Initialized Redis slot cache for Course {}: {} remaining slots", courseId, remainingSlots);
        }

        // Thực hiện trừ 1 chỗ trống một cách nguyên tử (Atomic DECR)
        Long remaining = redisTemplate.opsForValue().decrement(key);
        if (remaining != null && remaining < 0) {
            // Nếu số chỗ còn lại < 0 -> Lớp đã đầy! Hoàn lại 1 slot vừa trừ để giữ nguyên con số 0 trên Redis
            redisTemplate.opsForValue().increment(key);
            log.warn("Fast Rejection at API Edge: Course {} is full (Redis slot < 0)", courseId);
            return false;
        }

        return true;
    }
}
