package com.datct.datn.auth;

import com.datct.datn.auth.DTO.LoginRequest;
import com.datct.datn.auth.DTO.LoginResponse;
import com.datct.datn.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody LoginRequest request
    ) {

        String token = authService.login(request);

        return new LoginResponse(token);
    }
}
