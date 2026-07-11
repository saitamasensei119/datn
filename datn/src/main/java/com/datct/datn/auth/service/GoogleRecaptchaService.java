package com.datct.datn.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class GoogleRecaptchaService {

    // Khóa Secret kiểm định chính thức từ Google (Test Key - luôn hợp lệ cho localhost/LAN)
    // Khi chạy production có thể override bằng biến cấu hình application.properties: google.recaptcha.secret
    @Value("${google.recaptcha.secret:6LeIxAcTAAAAAGG-vFI1TnRWxMZjcUhxKNgMvri}")
    private String recaptchaSecret;

    private static final String RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Xác thực chuỗi Token do Google reCAPTCHA trả về từ Frontend.
     */
    public boolean verifyCaptcha(String captchaToken, String clientIp) {
        if (captchaToken == null || captchaToken.trim().isEmpty()) {
            log.warn("CẢNH BÁO: Request thiếu mã captchaToken khi xác thực reCAPTCHA!");
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("secret", recaptchaSecret);
            map.add("response", captchaToken);
            if (clientIp != null && !clientIp.isEmpty()) {
                map.add("remoteip", clientIp);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(RECAPTCHA_VERIFY_URL, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                log.info("Xác thực Google reCAPTCHA thành công từ IP: {}", clientIp);
                return true;
            } else {
                log.warn("Xác thực Google reCAPTCHA thất bại từ IP [{}]. Phản hồi từ Google: {}", clientIp, body != null ? body.get("error-codes") : "null");
                return false;
            }
        } catch (Exception e) {
            log.error("Lỗi kết nối tới máy chủ Google reCAPTCHA: {}", e.getMessage());
            // Trầm lỗi nhẹ nếu mất mạng lúc test local bằng Test Key
            if ("6LeIxAcTAAAAAGG-vFI1TnRWxMZjcUhxKNgMvri".equals(recaptchaSecret)) {
                log.info("[TEST KEY MODE] Bỏ qua lỗi kết nối mạng với Google, cho phép xác thực thành công.");
                return true;
            }
            return false;
        }
    }
}
