package com.datct.datn.modules.subject.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSubjectRequest {

    private String subjectCode;

    private String name;

    private Integer credits;

    private Long departmentId;
}
