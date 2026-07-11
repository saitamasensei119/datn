package com.datct.datn.modules.lecturer.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateLecturerRequest {

    private String fullName;

    private String email;

    private String password;

    private String lecturerCode;

    private Long departmentId;

    private String personalEmail;

    private String phoneNumber;
}
