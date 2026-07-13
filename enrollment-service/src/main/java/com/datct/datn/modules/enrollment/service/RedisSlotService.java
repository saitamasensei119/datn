package com.datct.datn.modules.enrollment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisSlotService {

    private final StringRedisTemplate redisTemplate;
    private static final String SLOT_KEY_PREFIX = "course:slots:";

    /**
     * Cơ chế hoàn trả tự động (Slot Compensation / Rollback):
     * Khi Worker thẩm định thất bại (chưa đủ điều kiện, lố tín chỉ) hoặc sinh viên hủy môn,
     * thực hiện cộng lại (+1) slot lên Redis để trả chỗ cho người khác.
     */
    public void releaseSlot(Long courseId) {
        String key = SLOT_KEY_PREFIX + courseId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            Long newSlots = redisTemplate.opsForValue().increment(key);
            log.info("Released (+1) slot back to Redis cache for Course {}. Current slots: {}", courseId, newSlots);
        }
    }
}
