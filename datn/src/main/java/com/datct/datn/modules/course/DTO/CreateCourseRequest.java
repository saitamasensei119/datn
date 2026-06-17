package com.datct.datn.modules.course.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCourseRequest {

    private Long subjectId;

    private Long lecturerId;

    private Long semesterId;

    private String courseCode;

    private Integer maxStudents;

    private String attachedCourseCode;

    private String note;

    private String openingBatch;

    private Double midtermWeight;
}
