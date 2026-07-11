package com.datct.datn.auth;

import com.datct.datn.auth.DTO.*;
import com.datct.datn.auth.service.AuthService;
import com.datct.datn.common.util.CookieUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication Controller", description = "Các API xác thực, đăng nhập và quản lý phiên làm việc Dual Token (với Cookie HttpOnly)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Trả về Access Token trong body và đặt Refresh Token vào HttpOnly Cookie")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        LoginResponse loginResp = authService.login(request);
        if (loginResp.getRefreshToken() != null) {
            ResponseCookie cookie = CookieUtil.createRefreshTokenCookie(loginResp.getRefreshToken(), httpRequest);
            response.addHeader("Set-Cookie", cookie.toString());
            loginResp.setRefreshToken(null); // Không trả về refreshToken trong JSON body chống XSS
        }
        return ResponseEntity.ok(loginResp);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token", description = "Sử dụng Refresh Token từ HttpOnly Cookie (hoặc Body) để lấy Access Token mới")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@RequestBody(required = false) RefreshTokenRequest requestBody, HttpServletRequest httpRequest, HttpServletResponse response) {
        String tokenStr = CookieUtil.getRefreshTokenFromCookie(httpRequest);
        if (tokenStr == null && requestBody != null) {
            tokenStr = requestBody.getRefreshToken();
        }
        if (tokenStr == null || tokenStr.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        TokenRefreshResponse refreshResp = authService.refreshToken(new RefreshTokenRequest(tokenStr));
        if (refreshResp.getRefreshToken() != null) {
            ResponseCookie cookie = CookieUtil.createRefreshTokenCookie(refreshResp.getRefreshToken(), httpRequest);
            response.addHeader("Set-Cookie", cookie.toString());
            refreshResp.setRefreshToken(null); // Không trả về refreshToken trong JSON body
        }
        return ResponseEntity.ok(refreshResp);
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất & Thu hồi Refresh Token", description = "Thu hồi Refresh Token trong cơ sở dữ liệu và xóa Cookie HttpOnly")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshTokenRequest requestBody, HttpServletRequest httpRequest, HttpServletResponse response) {
        String tokenStr = CookieUtil.getRefreshTokenFromCookie(httpRequest);
        if (tokenStr == null && requestBody != null) {
            tokenStr = requestBody.getRefreshToken();
        }
        if (tokenStr != null && !tokenStr.trim().isEmpty()) {
            authService.logout(new RefreshTokenRequest(tokenStr));
        }
        ResponseCookie deleteCookie = CookieUtil.deleteRefreshTokenCookie(httpRequest);
        response.addHeader("Set-Cookie", deleteCookie.toString());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu khôi phục mật khẩu", description = "Gửi mã OTP 6 số tới email cá nhân của sinh viên/giảng viên")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu với OTP", description = "Sử dụng mã OTP 6 số để đặt lại mật khẩu mới và thu hồi toàn bộ token cũ")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
