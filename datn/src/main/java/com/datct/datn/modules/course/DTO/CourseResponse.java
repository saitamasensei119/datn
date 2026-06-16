package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CourseResponse {

    private Long id;

    private String courseCode;

    private Integer maxStudents;

    private String subjectName;

    private String lecturerName;

    private String semesterName;

    private CourseStatus status;

    private Long subjectId;

    private Long lecturerId;

    private Long semesterId;

    private String weekPattern;

    private String openingBatch;

    private Double midtermWeight;
}
