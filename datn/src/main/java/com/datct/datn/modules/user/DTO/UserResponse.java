package com.datct.datn.modules.user.DTO;

import com.datct.datn.modules.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponse {

    private Long id;

    private String fullName;

    private String email;

    private Role role;
}