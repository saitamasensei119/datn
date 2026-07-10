package com.datct.datn.auth.service;

import com.datct.datn.auth.DTO.LoginRequest;
import com.datct.datn.auth.DTO.LoginResponse;
import com.datct.datn.auth.DTO.RefreshTokenRequest;
import com.datct.datn.auth.DTO.TokenRefreshResponse;
import com.datct.datn.auth.entity.RefreshToken;
import com.datct.datn.auth.jwt.JwtService;
import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.modules.user.entity.User;
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
}
