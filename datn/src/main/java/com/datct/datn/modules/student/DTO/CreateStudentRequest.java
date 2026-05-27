package com.datct.datn.modules.student.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateStudentRequest {

    private String fullName;

    private String email;

    private String password;

    private String studentCode;

    private Long departmentId;
}
