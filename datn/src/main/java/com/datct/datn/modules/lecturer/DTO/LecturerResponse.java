package com.datct.datn.modules.lecturer.DTO;

import com.datct.datn.modules.lecturer.entity.LecturerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LecturerResponse {

    private Long id;

    private String lecturerCode;

    private String fullName;

    private String email;

    private String departmentName;
    private LecturerStatus status;

    private String personalEmail;

    private String phoneNumber;

    public LecturerResponse(Long id, String lecturerCode, String fullName, String email, String departmentName, LecturerStatus status) {
        this.id = id;
        this.lecturerCode = lecturerCode;
        this.fullName = fullName;
        this.email = email;
        this.departmentName = departmentName;
        this.status = status;
    }
}
