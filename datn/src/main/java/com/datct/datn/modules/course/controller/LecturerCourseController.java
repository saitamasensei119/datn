package com.datct.datn.modules.course.controller;

import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.service.CourseService;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.student.DTO.StudentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/courses")
@RequiredArgsConstructor
public class LecturerCourseController {
    private final CourseService courseService;
    @GetMapping("/my-courses")
    public List<CourseResponse> getMyCourses() {
        return courseService
                .getCoursesOfLecturer();
    }

    @GetMapping("/{courseId}/students")
    public List<StudentResponse> getStudentsByCourseId(
            @PathVariable Long courseId
    ) {
        return courseService.getStudentsByCourseId(courseId);
    }

}
