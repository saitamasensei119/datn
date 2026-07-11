package com.datct.datn.modules.user.controller;

import com.datct.datn.modules.user.DTO.ChangeAvatarRequest;
import com.datct.datn.modules.user.DTO.ChangePasswordRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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



    @Operation(summary = "Tải lên tệp ảnh đại diện (File Upload)", description = "Tải ảnh từ máy tính với kiểm tra bảo mật nhị phân Magic Bytes (< 5MB, JPG/PNG/WEBP/GIF)")
    @PostMapping(value = "/avatar/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String email = getCurrentUserEmail();
        UserResponse response = profileService.uploadAvatar(email, file);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Thay đổi thông tin liên lạc cá nhân", description = "Cập nhật Email cá nhân và Số điện thoại tại bảng Student hoặc Lecturer")
    @PutMapping("/contact")
    public ResponseEntity<UserResponse> changeContact(@Valid @RequestBody com.datct.datn.modules.user.DTO.UpdatePersonalContactRequest request) {
        String email = getCurrentUserEmail();
        UserResponse response = profileService.updateContact(email, request);
        return ResponseEntity.ok(response);
    }
}
