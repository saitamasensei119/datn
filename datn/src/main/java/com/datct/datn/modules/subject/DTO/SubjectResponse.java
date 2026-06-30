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

    private String englishName;

    private String subjectType;

    private String labRequirement;

    private String programCode;

    private String note;

    private String managementCode;

    private Integer theoryCredits;

    private Integer exerciseCredits;

    private Integer practicalCredits;

    private Integer selfStudyHours;

    private String labBuilding;

    private String preferredBuilding;
}
