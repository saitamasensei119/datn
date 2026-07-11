package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.timetable.DTO.ClassScheduleResponse;
import java.util.List;

public record StudentCourseResponse(
        Long id,
        String courseCode,
        String subjectName,
        Integer maxStudents,
        CourseStatus status,
        List<ClassScheduleResponse> schedules
) {
}
