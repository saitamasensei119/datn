package com.datct.datn.modules.course.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCourseRequest {

    private Long subjectId;

    private Long lecturerId;

    private Long semesterId;

    private String courseCode;

    private Integer maxStudents;
}