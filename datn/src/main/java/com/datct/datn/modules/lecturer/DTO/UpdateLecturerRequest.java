package com.datct.datn.modules.lecturer.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateLecturerRequest {

    private String fullName;

    private String email;

    private String lecturerCode;

    private Long departmentId;
}
