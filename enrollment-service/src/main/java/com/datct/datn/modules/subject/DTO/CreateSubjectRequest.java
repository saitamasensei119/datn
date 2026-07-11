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

    private String englishName;

    private String subjectType;

    private String labRequirement;

    private String programCode;

    private String note;

    private String managementCode;

    private Integer theoryCredits = 0;

    private Integer exerciseCredits = 0;

    private Integer practicalCredits = 0;

    private Integer selfStudyHours = 0;

    private String labBuilding;

    private String preferredBuilding;
}
