package com.datct.datn.modules.user.DTO;

import com.datct.datn.modules.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;

    private String fullName;

    private String email;

    private Role role;

    private String avatar;

    private String personalEmail;

    private String phoneNumber;

    public static UserResponse fromEntity(com.datct.datn.modules.user.entity.User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatar(),
                null,
                null
        );
    }
}