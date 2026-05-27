package com.datct.datn.modules.course.DTO;

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
}
