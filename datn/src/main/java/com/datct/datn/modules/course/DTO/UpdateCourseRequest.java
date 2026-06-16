package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.CourseStatus;
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

    private CourseStatus status;

    private String weekPattern;

    private String openingBatch;

    private Double midtermWeight;
}