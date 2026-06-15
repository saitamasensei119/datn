package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.CourseStatus;

public record StudentCourseResponse(
        Long id,
        String courseCode,
        String subjectName,
        Integer maxStudents,
        CourseStatus status
) {
}
