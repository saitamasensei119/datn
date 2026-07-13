package com.datct.datn.modules.enrollment.service;

import com.datct.datn.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "enrollment.consumer.enabled", havingValue = "true", matchIfMissing = true)
public class EnrollmentConsumer {

    private final EnrollmentService enrollmentService;
    private final RedisSlotService redisSlotService;

    @RabbitListener(queues = RabbitMQConfig.ENROLLMENT_QUEUE)
    public void consumeEnrollmentRequest(Map<String, Object> message) {
        log.info("Received enrollment request from RabbitMQ: {}", message);
        try {
            Long studentId = Long.valueOf(message.get("studentId").toString());
            Long courseId = Long.valueOf(message.get("courseId").toString());
            boolean ignoreWarning = Boolean.parseBoolean(message.get("ignoreWarning").toString());

            enrollmentService.processEnrollmentTask(studentId, courseId, ignoreWarning);
            log.info("Successfully processed enrollment for Student {} and Course {}", studentId, courseId);
        } catch (Exception e) {
            log.error("Failed to process enrollment request from RabbitMQ: {}. Triggering Redis slot rollback compensation...", e.getMessage());
            try {
                if (message.get("courseId") != null) {
                    Long courseId = Long.valueOf(message.get("courseId").toString());
                    redisSlotService.releaseSlot(courseId);
                }
            } catch (Exception ex) {
                log.error("Error during Redis slot rollback compensation: {}", ex.getMessage());
            }
            // In a production system, we might save this to a failed_enrollments table or Dead Letter Queue
        }
    }
}
