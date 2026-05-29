package com.datct.datn.auth.service;

import com.datct.datn.auth.DTO.LoginRequest;
import com.datct.datn.auth.jwt.JwtService;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new RuntimeException("Wrong password");
        }

        return jwtService.generateToken(user);
    }
}
