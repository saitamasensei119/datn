package com.datct.datn.modules.user.controller;

import com.datct.datn.modules.user.DTO.CreateUserRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PostMapping
    public UserResponse createUser(
            @RequestBody CreateUserRequest request
    ) {

        return userService.createUser(request);
    }
}