package com.datct.datn.modules.subject.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SubjectResponse {

    private Long id;

    private String subjectCode;

    private String name;

    private Integer credits;

    private Long departmentId;

    private String departmentName;
}
