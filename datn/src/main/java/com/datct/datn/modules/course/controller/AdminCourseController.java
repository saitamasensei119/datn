package com.datct.datn.modules.course.controller;

import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.DTO.CreateCourseRequest;
import com.datct.datn.modules.course.DTO.UpdateCourseRequest;
import com.datct.datn.modules.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;

    @PostMapping
    public CourseResponse create(
            @RequestBody CreateCourseRequest request
    ) {

        return courseService.create(request);
    }

    @GetMapping
    public List<CourseResponse> getAll() {

        return courseService.getAll();
    }

    @GetMapping("/{id}")
    public CourseResponse getById(
            @PathVariable Long id
    ) {

        return courseService.getById(id);
    }

    @PutMapping("/{id}")
    public CourseResponse update(
            @PathVariable Long id,
            @RequestBody UpdateCourseRequest request
    ) {

        return courseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        courseService.delete(id);
    }
}
