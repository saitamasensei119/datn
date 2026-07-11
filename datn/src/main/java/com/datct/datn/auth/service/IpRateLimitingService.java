package com.datct.datn.auth.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class IpRateLimitingService {

    private static final int MAX_FAILED_ATTEMPTS_PER_HOUR = 15;
    private static final int BLOCK_DURATION_HOURS = 1;

    private final Map<String, AttemptCounter> cache = new ConcurrentHashMap<>();

    @Data
    @AllArgsConstructor
    private static class AttemptCounter {
        private int count;
        private LocalDateTime firstAttemptTime;
        private LocalDateTime blockedUntil;
    }

    /**
     * Kiểm tra xem địa chỉ IP này có đang bị chặn hay không.
     */
    public boolean isBlocked(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        AttemptCounter counter = cache.get(ip);
        if (counter == null) {
            return false;
        }
        if (counter.getBlockedUntil() != null && counter.getBlockedUntil().isAfter(LocalDateTime.now())) {
            log.warn("CẢNH BÁO BẢO MẬT: Từ chối đăng nhập từ IP bị chặn [{}]", ip);
            return true;
        }
        // Nếu thời gian chặn đã hết hoặc cửa sổ 1 giờ đã qua, tự động reset
        if (counter.getBlockedUntil() != null && counter.getBlockedUntil().isBefore(LocalDateTime.now())) {
            cache.remove(ip);
            return false;
        }
        if (counter.getFirstAttemptTime().plusHours(1).isBefore(LocalDateTime.now())) {
            cache.remove(ip);
            return false;
        }
        return false;
    }

    /**
     * Ghi nhận 1 lần nhập sai mật khẩu từ IP này.
     */
    public void recordFailedAttempt(String ip) {
        if (ip == null || ip.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        cache.compute(ip, (key, counter) -> {
            if (counter == null || counter.getFirstAttemptTime().plusHours(1).isBefore(now)) {
                return new AttemptCounter(1, now, null);
            }
            int newCount = counter.getCount() + 1;
            LocalDateTime blockedUntil = null;
            if (newCount >= MAX_FAILED_ATTEMPTS_PER_HOUR) {
                blockedUntil = now.plusHours(BLOCK_DURATION_HOURS);
                log.error("CẢNH BÁO BẢO MẬT: Địa chỉ IP [{}] đã nhập sai {} lần trong 1 giờ -> KHÓA IP TRONG {} GIỜ!", ip, newCount, BLOCK_DURATION_HOURS);
            }
            return new AttemptCounter(newCount, counter.getFirstAttemptTime(), blockedUntil);
        });
    }

    /**
     * Xóa dấu vết lỗi khi đăng nhập thành công từ IP này.
     */
    public void resetAttempts(String ip) {
        if (ip != null) {
            cache.remove(ip);
        }
    }

    /**
     * Định kỳ chạy mỗi 1 giờ để dọn dẹp RAM, xóa các IP cũ không còn bị khóa.
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanupExpiredIps() {
        LocalDateTime now = LocalDateTime.now();
        cache.entrySet().removeIf(entry -> {
            AttemptCounter counter = entry.getValue();
            return (counter.getBlockedUntil() != null && counter.getBlockedUntil().isBefore(now)) ||
                   (counter.getFirstAttemptTime().plusHours(1).isBefore(now));
        });
    }
}
