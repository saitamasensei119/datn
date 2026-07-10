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

        boolean exists = userRepository
                .findByEmail(request.getEmail())
                .isPresent();

        if (exists) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        User user = new User();

        user.setFullName(request.getFullName());

        user.setEmail(request.getEmail());

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
