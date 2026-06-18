package com.datct.datn.modules.enrollment.controller;

import com.datct.datn.modules.enrollment.DTO.PreRegistrationResponse;
import com.datct.datn.modules.enrollment.service.PreRegistrationService;
import com.datct.datn.auth.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pre-registrations")
public class PreRegistrationController {

    @Autowired
    private PreRegistrationService preRegistrationService;

    @PostMapping
    public ResponseEntity<?> registerIntent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long subjectId,
            @RequestParam Long semesterId) {
        if (!"STUDENT".equals(userDetails.getUser().getRole().name())) {
            return ResponseEntity.status(403).body("Chỉ sinh viên mới được đăng ký nguyện vọng.");
        }
        try {
            Long userId = userDetails.getUser().getId();
            PreRegistrationResponse response = preRegistrationService.registerIntent(userId, subjectId, semesterId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeIntent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        if (!"STUDENT".equals(userDetails.getUser().getRole().name())) {
            return ResponseEntity.status(403).body("Chỉ sinh viên mới được thao tác.");
        }
        try {
            preRegistrationService.removeIntent(id);
            return ResponseEntity.ok("Hủy đăng ký thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyIntents(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long semesterId) {
        if (!"STUDENT".equals(userDetails.getUser().getRole().name())) {
            return ResponseEntity.status(403).body("Chỉ sinh viên mới được thao tác.");
        }
        try {
            Long userId = userDetails.getUser().getId();
            List<PreRegistrationResponse> list = preRegistrationService.getMyIntents(userId, semesterId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me/credits")
    public ResponseEntity<?> getMyTotalCredits(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long semesterId) {
        if (!"STUDENT".equals(userDetails.getUser().getRole().name())) {
            return ResponseEntity.status(403).body("Chỉ sinh viên mới được thao tác.");
        }
        try {
            Long userId = userDetails.getUser().getId();
            Integer credits = preRegistrationService.getMyTotalCredits(userId, semesterId);
            return ResponseEntity.ok(credits);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
