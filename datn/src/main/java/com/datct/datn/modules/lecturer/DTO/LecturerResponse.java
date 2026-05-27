package com.datct.datn.modules.lecturer.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LecturerResponse {

    private Long id;

    private String lecturerCode;

    private String fullName;

    private String email;

    private String departmentName;
}
