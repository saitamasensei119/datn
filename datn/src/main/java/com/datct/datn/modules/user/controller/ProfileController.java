package com.datct.datn.modules.user.controller;

import com.datct.datn.modules.user.DTO.ChangeAvatarRequest;
import com.datct.datn.modules.user.DTO.ChangePasswordRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile Controller", description = "Các API Quản lý tài khoản cá nhân, Đổi mật khẩu và Đổi ảnh đại diện cho tất cả người dùng (Sinh viên, Giảng viên, Admin)")
public class ProfileController {

    private final ProfileService profileService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Operation(summary = "Lấy thông tin cá nhân", description = "Trả về thông tin chi tiết (kèm avatar) của người dùng đang đăng nhập")
    @GetMapping
    public ResponseEntity<UserResponse> getMyProfile() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(profileService.getProfile(email));
    }

    @Operation(summary = "Thay đổi mật khẩu", description = "Yêu cầu kiểm tra mật khẩu cũ trước khi cập nhật mật khẩu mới")
    @PutMapping("/password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = getCurrentUserEmail();
        profileService.changePassword(email, request);
        return ResponseEntity.ok("Thay đổi mật khẩu thành công");
    }

    @Operation(summary = "Thay đổi ảnh đại diện (Avatar)", description = "Cập nhật URL ảnh đại diện cho người dùng đang đăng nhập")
    @PutMapping("/avatar")
    public ResponseEntity<UserResponse> changeAvatar(@Valid @RequestBody ChangeAvatarRequest request) {
        String email = getCurrentUserEmail();
        UserResponse response = profileService.changeAvatar(email, request);
        return ResponseEntity.ok(response);
    }
}
