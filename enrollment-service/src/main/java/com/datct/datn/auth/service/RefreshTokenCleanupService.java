package com.datct.datn.auth.service;

import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.modules.user.repository.PasswordResetTokenRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;

    /**
     * DUY NHẤT 1 bộ đếm lịch (Cron Job) chạy lúc 3:00 sáng mỗi ngày
     * để tổng vệ sinh toàn bộ dữ liệu tạm và rác hệ thống (System Housekeeping).
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void nightlySystemCleanup() {
        log.info("[CRON JOB 3:00 AM] Bắt đầu tổng vệ sinh hệ thống...");

        try {
            // 1. Xóa Refresh Token hết hạn quá 7 ngày (giữ lại 7 ngày để kiểm tra chống Replay Attack)
            LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
            refreshTokenRepository.purgeExpiredTokensBefore(cutoff);
            log.info("[CRON JOB] Đã dọn dẹp các Refresh Token hết hạn quá 7 ngày.");
        } catch (Exception e) {
            log.error("[CRON JOB] Lỗi khi xóa Refresh Token cũ: {}", e.getMessage());
        }

        try {
            // 2. Xóa các mã OTP quên mật khẩu đã hết hạn (15 phút)
            passwordResetTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
            log.info("[CRON JOB] Đã dọn dẹp các mã OTP quên mật khẩu hết hạn.");
        } catch (Exception e) {
            log.error("[CRON JOB] Lỗi khi xóa OTP hết hạn: {}", e.getMessage());
        }

        try {
            // 3. Reset số lần đăng nhập sai (failedLoginAttempts) và mở khóa các tài khoản quá hạn khóa
            userRepository.resetStaleFailedLoginAttempts(LocalDateTime.now());
            log.info("[CRON JOB] Đã reset bộ đếm đăng nhập sai cho các tài khoản quá hạn.");
        } catch (Exception e) {
            log.error("[CRON JOB] Lỗi khi reset bộ đếm đăng nhập sai: {}", e.getMessage());
        }

        try {
            // 4. Dọn dẹp rác file tạm Excel trong thư mục Temp của hệ điều hành
            cleanupTempFiles();
        } catch (Exception e) {
            log.error("[CRON JOB] Lỗi khi dọn dẹp file tạm: {}", e.getMessage());
        }

        log.info("[CRON JOB 3:00 AM] Hoàn tất tổng vệ sinh hệ thống.");
    }

    private void cleanupTempFiles() {
        String tmpDir = System.getProperty("java.io.tmpdir");
        if (tmpDir != null) {
            File dir = new File(tmpDir);
            File[] files = dir.listFiles((d, name) -> name.startsWith("xlsx_") || name.startsWith("poifiles") || (name.endsWith(".tmp") && name.contains("datn")));
            if (files != null) {
                int count = 0;
                long now = System.currentTimeMillis();
                for (File f : files) {
                    // Xóa file tạm cũ hơn 24 giờ
                    if (now - f.lastModified() > 86400000L) {
                        if (f.delete()) count++;
                    }
                }
                if (count > 0) {
                    log.info("[CRON JOB] Đã xóa {} file tạm Excel cũ khỏi bộ nhớ Temp.", count);
                }
            }
        }
    }
}
