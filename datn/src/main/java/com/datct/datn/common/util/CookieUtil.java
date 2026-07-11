package com.datct.datn.common.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    public static final long REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 ngày (giây)

    /**
     * Tạo ResponseCookie HttpOnly bảo mật cho Refresh Token.
     * Tự động điều chỉnh cờ Secure và SameSite theo giao thức (HTTPS vs HTTP local).
     */
    public static ResponseCookie createRefreshTokenCookie(String token, HttpServletRequest request) {
        boolean isSecure = request != null && request.isSecure(); // True nếu dùng HTTPS
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(REFRESH_TOKEN_MAX_AGE_SECONDS)
                .sameSite(isSecure ? "Strict" : "Lax")
                .build();
    }

    /**
     * Tạo ResponseCookie với MaxAge = 0 để thu hồi/xóa Cookie Refresh Token trên trình duyệt.
     */
    public static ResponseCookie deleteRefreshTokenCookie(HttpServletRequest request) {
        boolean isSecure = request != null && request.isSecure();
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(0)
                .sameSite(isSecure ? "Strict" : "Lax")
                .build();
    }

    /**
     * Đọc giá trị Refresh Token từ danh sách Cookie trong HttpServletRequest.
     */
    public static String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
