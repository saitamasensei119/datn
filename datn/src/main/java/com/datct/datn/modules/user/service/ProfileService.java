package com.datct.datn.modules.user.service;

import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.modules.user.DTO.ChangeAvatarRequest;
import com.datct.datn.modules.user.DTO.ChangePasswordRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không trùng khớp");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordResetDate(LocalDateTime.now());
        userRepository.save(user);

        // Thu hồi toàn bộ Refresh Token của user này
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public UserResponse changeAvatar(String email, ChangeAvatarRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        user.setAvatar(request.getAvatarUrl());
        userRepository.save(user);

        return UserResponse.fromEntity(user);
    }
}
