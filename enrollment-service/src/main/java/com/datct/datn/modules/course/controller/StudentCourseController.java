package com.datct.datn.modules.course.controller;

import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.DTO.CreateCourseRequest;
import com.datct.datn.modules.course.DTO.UpdateCourseRequest;
import com.datct.datn.modules.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/courses")
@RequiredArgsConstructor
public class StudentCourseController {
    private final CourseService courseService;

    @GetMapping
    public Page<CourseResponse> getCourses(
            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").descending()
        );

        return courseService.getOpenCourses(pageable);
    }
    @GetMapping("/search/code")
    public Page<CourseResponse> searchByCourseCode(
            @RequestParam String courseCode,
            Pageable pageable
    ) {
        return courseService.searchOpenCoursesByCourseCode(courseCode, pageable);
    }
    @GetMapping("/search/subject-code")
    public Page<CourseResponse> searchBySubjectCode(
            @RequestParam String subjectCode,
            Pageable pageable
    ) {
        return courseService.searchOpenCoursesBySubjectCode(subjectCode, pageable);
    }
    @GetMapping("/search/subject-name")
    public Page<CourseResponse> searchBySubjectName(
            @RequestParam String name,
            Pageable pageable
    ) {
        return courseService.searchOpenCoursesBySubjectName(name, pageable);
    }
    @GetMapping("/search")
    public Page<CourseResponse> searchOpenCourses(
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) String subjectName,
            Pageable pageable
    ) {
        if (courseCode != null) {
            return courseService.searchOpenCoursesByCourseCode(courseCode, pageable);
        }

        if (subjectCode != null) {
            return courseService.searchOpenCoursesBySubjectCode(subjectCode, pageable);
        }

        if (subjectName != null) {
            return courseService.searchOpenCoursesBySubjectName(subjectName, pageable);
        }

        return courseService.getOpenCourses(pageable);
    }

    @GetMapping("/{id}")
    public CourseResponse getById(@PathVariable Long id) {
        return courseService.getById(id);
    }
}
