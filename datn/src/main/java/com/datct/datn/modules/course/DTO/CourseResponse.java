package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
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

    private String attachedCourseCode;

    private String note;

    private String openingBatch;

    private Double midtermWeight;

    private List<com.datct.datn.modules.timetable.DTO.ClassScheduleResponse> schedules;
}
