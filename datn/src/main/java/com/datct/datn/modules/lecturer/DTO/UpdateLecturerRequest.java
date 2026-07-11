package com.datct.datn.modules.lecturer.DTO;

import com.datct.datn.modules.lecturer.entity.LecturerStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateLecturerRequest {

    private String fullName;

    private String email;

    private String lecturerCode;

    private Long departmentId;

    private LecturerStatus status;

    private Boolean enabled;

    private String personalEmail;

    private String phoneNumber;
}
