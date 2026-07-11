package com.datct.datn.modules.enrollment.service;

import com.datct.datn.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendEnrollmentRequest(Long studentId, Long courseId, boolean ignoreWarning) {
        log.info("Sending enrollment request to RabbitMQ -> Student: {}, Course: {}", studentId, courseId);
        Map<String, Object> message = Map.of(
                "studentId", studentId,
                "courseId", courseId,
                "ignoreWarning", ignoreWarning
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.ENROLLMENT_EXCHANGE, RabbitMQConfig.ENROLLMENT_ROUTING_KEY, message);
    }
}
