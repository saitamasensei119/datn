package com.datct.datn.auth.service;

import com.datct.datn.auth.DTO.*;
import com.datct.datn.auth.entity.RefreshToken;
import com.datct.datn.auth.jwt.JwtService;
import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.common.service.EmailService;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.user.entity.PasswordResetToken;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.PasswordResetTokenRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

    @Transactional
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác"));

        // Kiểm tra tài khoản có bị khóa tạm thời hay không
        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Tăng số lần đăng nhập sai
            int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
            throw new RuntimeException("Email hoặc mật khẩu không chính xác");
        }

        // Đăng nhập thành công -> Reset số lần đăng nhập sai
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        // Tạo Access Token & Refresh Token
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenStr = jwtService.generateRefreshToken(user);

        // Lưu RefreshToken vào DB
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        return new LoginResponse(accessToken, refreshTokenStr);
    }

    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        if (tokenStr == null || tokenStr.trim().isEmpty()) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Refresh token không tồn tại hoặc đã hết hạn"));

        if (refreshToken.getRevoked() || refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token đã bị thu hồi hoặc hết hạn. Vui lòng đăng nhập lại.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshTokenStr = jwtService.generateRefreshToken(user);

        // Cập nhật lại refresh token mới (Rotation)
        refreshToken.setToken(newRefreshTokenStr);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshToken);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenStr);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null) {
            return;
        }
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String identifier = request.getEmail() != null ? request.getEmail().trim() : "";
        User user = userRepository.findByEmail(identifier).orElse(null);

        if (user != null) {
            String targetEmail = user.getEmail();
            if (user.getRole() == Role.STUDENT) {
                var studentOpt = studentRepository.findByUserId(user.getId());
                if (studentOpt.isPresent() && studentOpt.get().getPersonalEmail() != null && !studentOpt.get().getPersonalEmail().trim().isEmpty()) {
                    targetEmail = studentOpt.get().getPersonalEmail().trim();
                }
            } else if (user.getRole() == Role.TEACHER) {
                var lecturerOpt = lecturerRepository.findByUserId(user.getId());
                if (lecturerOpt.isPresent() && lecturerOpt.get().getPersonalEmail() != null && !lecturerOpt.get().getPersonalEmail().trim().isEmpty()) {
                    targetEmail = lecturerOpt.get().getPersonalEmail().trim();
                }
            }

            String otpCode = String.format("%06d", new java.util.Random().nextInt(1000000));
            PasswordResetToken resetToken = new PasswordResetToken(otpCode, user, LocalDateTime.now().plusMinutes(15));
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetOtp(targetEmail, otpCode);
        }

        return "Nếu tài khoản tồn tại trong hệ thống, hướng dẫn và mã OTP khôi phục mật khẩu đã được gửi tới email cá nhân của bạn.";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new RuntimeException("Mã OTP không được để trống");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken().trim())
                .orElseThrow(() -> new RuntimeException("Mã xác thực OTP không hợp lệ hoặc không tồn tại"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Mã xác thực OTP đã hết hạn (15 phút). Vui lòng yêu cầu mã mới.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không trùng khớp");
        }

        User user = resetToken.getUser();
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordResetDate(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.deleteByUser(user);

        return "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.";
    }
}
