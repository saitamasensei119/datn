package com.datct.datn.auth.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {

    @NotBlank(message = "Email hoặc mã định danh tài khoản không được để trống")
    private String email;
}
