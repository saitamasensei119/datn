package com.datct.datn.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class TokenHashUtil {

    /**
     * Băm chuỗi gốc (Raw Token / JWT) bằng thuật toán SHA-256
     * và chuyển đổi sang chuỗi Hex 64 ký tự chữ thường.
     *
     * @param rawToken Chuỗi Token gốc nhận được từ Client hoặc vừa sinh ra
     * @return Chuỗi Hex SHA-256 (64 ký tự) dùng để lưu và truy vấn trong CSDL
     */
    public static String sha256(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Refresh token không được để trống.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi băm SHA-256 cho Token: " + e.getMessage(), e);
        }
    }
}
