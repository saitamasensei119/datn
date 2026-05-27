package com.datct.datn.modules.student.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStudentRequest {

    private String fullName;

    private String email;

    private String studentCode;

    private Long departmentId;
}