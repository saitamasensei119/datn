package com.datct.datn.modules.student.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StudentResponse {

    private Long id;

    private String studentCode;

    private String fullName;

    private String email;

    private String departmentName;
}