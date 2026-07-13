package com.datct.datn.auth.service;

import com.datct.datn.auth.DTO.*;
import com.datct.datn.auth.entity.RefreshToken;
import com.datct.datn.auth.jwt.JwtService;
import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.common.service.EmailService;
import com.datct.datn.common.util.TokenHashUtil;
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
    private final IpRateLimitingService ipRateLimitingService;
    private final GoogleRecaptchaService googleRecaptchaService;

    @Transactional(noRollbackFor = {RuntimeException.class, Exception.class})
    public LoginResponse login(LoginRequest request) {
        return login(request, "unknown");
    }

    @Transactional(noRollbackFor = {RuntimeException.class, Exception.class})
    public LoginResponse login(LoginRequest request, String clientIp) {
        // 1. Kiểm tra khóa theo địa chỉ IP (Layer 1 - In-Memory Cache)
        if (ipRateLimitingService.isBlocked(clientIp)) {
            throw new RuntimeException("Quyền truy cập từ địa chỉ IP của bạn tạm thời bị từ chối do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 giờ.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    ipRateLimitingService.recordFailedAttempt(clientIp);
                    return new RuntimeException("Email hoặc mật khẩu không chính xác");
                });

        // 2. Kiểm tra tài khoản có bị khóa tạm thời hay không
        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.");
        }

        int currentAttempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();

        // 3. Nếu số lần gõ sai >= 3 hoặc có gửi kèm captchaToken -> Yêu cầu kiểm minh reCAPTCHA (Layer 2)
        if (currentAttempts >= 3 || (request.getCaptchaToken() != null && !request.getCaptchaToken().trim().isEmpty())) {
            if (request.getCaptchaToken() == null || request.getCaptchaToken().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng hoàn thành xác thực CAPTCHA (Tôi không phải là người máy) để tiếp tục.");
            }
            if (!googleRecaptchaService.verifyCaptcha(request.getCaptchaToken(), clientIp)) {
                ipRateLimitingService.recordFailedAttempt(clientIp);
                throw new RuntimeException("Mã xác thực CAPTCHA không đúng hoặc hết hạn. Vui lòng thử lại.");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Ghi nhận lỗi trên cả IP và Account
            ipRateLimitingService.recordFailedAttempt(clientIp);
            int attempts = currentAttempts + 1;
            user.setFailedLoginAttempts(attempts);

            // Cơ chế Tarpitting: Thêm độ trễ 1.5s để bẻ gãy tốc độ cào mật khẩu tự động của Hacker
            if (attempts >= 3) {
                try {
                    Thread.sleep(1500);
                } catch (InterruptedException ignored) {}
            }

            // Nâng ngưỡng khóa tài khoản từ 5 lên 10 lần sai (Layer 2 - Smart Lockout chống DoS)
            if (attempts >= 10) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
            throw new RuntimeException("Email hoặc mật khẩu không chính xác");
        }

        // Đăng nhập thành công -> Reset dấu vết lỗi trên IP và Account
        ipRateLimitingService.resetAttempts(clientIp);
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        // Tạo Access Token & Refresh Token
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenStr = jwtService.generateRefreshToken(user);

        // Lưu RefreshToken (dưới dạng Hash SHA-256) vào DB
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(TokenHashUtil.sha256(refreshTokenStr));
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        LoginResponse response = new LoginResponse(accessToken, refreshTokenStr);
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        if (user.getRole() != null) {
            response.setRole(user.getRole().name());
        }
        return response;
    }

    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        if (tokenStr == null || tokenStr.trim().isEmpty()) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        String hashedToken = TokenHashUtil.sha256(tokenStr);
        RefreshToken refreshToken = refreshTokenRepository.findByToken(hashedToken)
                .orElseThrow(() -> new RuntimeException("Refresh token không tồn tại hoặc đã quá hạn"));

        // CẢNH BÁO BẢO MẬT: Nếu Token này đã bị thu hồi (revoked = true) mà lại được gửi lên xin cấp mới
        // -> Phát hiện tấn công phát lại (Replay Attack / Refresh Token Reuse Detection)!
        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            // Ngay lập tức xóa/thu hồi toàn bộ Refresh Token của User này trên mọi thiết bị để bảo vệ tài khoản
            refreshTokenRepository.deleteByUser(refreshToken.getUser());
            throw new RuntimeException("Cảnh báo bảo mật: Phát hiện sử dụng lại Refresh Token đã thu hồi. Toàn bộ phiên đăng nhập đã bị khóa để bảo vệ tài khoản, vui lòng đăng nhập lại.");
        }

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshTokenStr = jwtService.generateRefreshToken(user);

        // Xóa token cũ khỏi DB khi xoay vòng sang token mới
        refreshTokenRepository.delete(refreshToken);

        // Tạo bản ghi RefreshToken mới (dưới dạng Hash SHA-256) cho phiên xoay vòng
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setToken(TokenHashUtil.sha256(newRefreshTokenStr));
        newRefreshToken.setUser(user);
        newRefreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        newRefreshToken.setRevoked(false);
        refreshTokenRepository.save(newRefreshToken);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenStr);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null) {
            return;
        }
        String hashedToken = TokenHashUtil.sha256(request.getRefreshToken());
        refreshTokenRepository.findByToken(hashedToken)
                .ifPresent(refreshTokenRepository::delete);
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
