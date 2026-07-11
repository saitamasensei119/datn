package com.datct.datn.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    public void sendPasswordResetOtp(String toEmail, String otpCode) {
        // Luôn in ra Console log để kiểm thử tiện lợi (Hybrid Mock mode)
        log.info("\n" +
                "=================== [MOCK EMAIL/OTP GATEWAY] ===================\n" +
                "Gửi tới Email : {}\n" +
                "Mã OTP 6 số   : {}\n" +
                "Nội dung      : [DATN] Mã xác thực đặt lại mật khẩu của bạn là: {}.\n" +
                "                Mã có hiệu lực trong vòng 15 phút. Không chia sẻ mã này.\n" +
                "================================================================", toEmail, otpCode, otpCode);

        // Nếu có cấu hình JavaMailSender (SMTP) thật, tiến hành gửi Email
        if (javaMailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("[DATN] Khôi phục mật khẩu - Mã OTP của bạn");
                message.setText("Xin chào,\n\n" +
                        "Bạn đã yêu cầu đặt lại mật khẩu trên hệ thống Quản lý Đại học.\n" +
                        "Mã xác thực (OTP) của bạn là: " + otpCode + "\n\n" +
                        "Mã này có hiệu lực trong 15 phút.\n" +
                        "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n" +
                        "Trân trọng,\nHệ thống Quản lý Đại học.");
                javaMailSender.send(message);
                log.info("Đã gửi email khôi phục mật khẩu thực tế tới: {}", toEmail);
            } catch (Exception e) {
                log.warn("Không thể gửi email SMTP thực tế tới: {} (Lỗi: {}). Mã OTP vẫn có thể dùng qua Console Log trên.", toEmail, e.getMessage());
            }
        }
    }
}
