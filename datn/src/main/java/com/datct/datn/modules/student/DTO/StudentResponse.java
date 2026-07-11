package com.datct.datn.modules.student.DTO;

import com.datct.datn.modules.student.entity.StudentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long id;

    private String fullName;

    private String email;

    private String studentCode;

    private Long departmentId;

    private String departmentName;


    private StudentStatus status;

    private String personalEmail;

    private String phoneNumber;

    public StudentResponse(Long id, String fullName, String email, String studentCode, Long departmentId, String departmentName, StudentStatus status) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.studentCode = studentCode;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
    }
}