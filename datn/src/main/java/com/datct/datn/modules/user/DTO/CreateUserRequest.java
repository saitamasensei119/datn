package com.datct.datn.modules.user.DTO;

import com.datct.datn.modules.user.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {

    private String fullName;

    private String email;

    private String password;

    private Role role;
}