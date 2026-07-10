package com.datct.datn.modules.user.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeAvatarRequest {

    @NotBlank(message = "Đường dẫn URL ảnh đại diện không được để trống")
    @Size(max = 1000, message = "URL ảnh không được vượt quá 1000 ký tự")
    @Pattern(regexp = "^(https?://.*)?$", message = "URL ảnh phải bắt đầu bằng http:// hoặc https://")
    private String avatarUrl;
}
