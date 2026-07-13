package com.datct.datn.modules.user.service;

import com.datct.datn.modules.user.DTO.CreateUserRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(
            CreateUserRequest request
    ) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (!cleanEmail.matches("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$")) {
            throw new RuntimeException("Định dạng email không hợp lệ: " + cleanEmail);
        }

        boolean exists = userRepository
                .findByEmail(cleanEmail)
                .isPresent();

        if (exists) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        User user = new User();

        user.setFullName(request.getFullName() != null ? request.getFullName().trim() : "");

        user.setEmail(cleanEmail);

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(request.getRole());

        userRepository.save(user);

        return UserResponse.fromEntity(user);
    }
}
