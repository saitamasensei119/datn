package com.datct.datn.modules.student.DTO;

import com.datct.datn.modules.student.entity.StudentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StudentResponse {

    private Long id;

    private String fullName;

    private String email;

    private String studentCode;

    private Long departmentId;

    private StudentStatus status;
}