package com.datct.datn.modules.course.controller;

import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.DTO.CreateCourseRequest;
import com.datct.datn.modules.course.DTO.UpdateCourseRequest;
import com.datct.datn.modules.course.service.CourseService;
import com.datct.datn.modules.grade.service.GradeService;
import com.datct.datn.modules.grade.DTO.GradeSubmissionResponse;
import com.datct.datn.modules.student.DTO.StudentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;
    private final GradeService gradeService;

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

    @GetMapping("/{courseId}/students")
    public List<StudentResponse> getStudentsByCourseId(
            @PathVariable Long courseId
    ) {
        return courseService.getStudentsByCourseId(courseId);
    }

    @GetMapping("/search")
    public List<CourseResponse> searchCourses(
            @RequestParam(required = false) String courseCode
    ) {
        return courseService.searchAdminCourses(courseCode);
    }

    @GetMapping("/{courseId}/students/search")
    public List<StudentResponse> searchStudentsInCourse(
            @PathVariable Long courseId,
            @RequestParam(required = false) String studentCode
    ) {
        return courseService.searchStudentsByCourseIdAndStudentCode(courseId, studentCode);
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

    @GetMapping("/{courseId}/submissions")
    public List<GradeSubmissionResponse> getSubmissions(
            @PathVariable Long courseId
    ) {
        return gradeService.getSubmissionsForCourse(courseId);
    }

    @PostMapping("/{courseId}/submissions/midterm/unlock")
    public ResponseEntity<String> unlockMidtermGrades(
            @PathVariable Long courseId
    ) {
        gradeService.unlockMidtermGrades(courseId);
        return ResponseEntity.ok("Đã mở khóa điểm giữa kỳ thành công");
    }

    @PostMapping("/{courseId}/submissions/final/unlock")
    public ResponseEntity<String> unlockFinalGrades(
            @PathVariable Long courseId
    ) {
        gradeService.unlockFinalGrades(courseId);
        return ResponseEntity.ok("Đã mở khóa điểm cuối kỳ thành công");
    }
}
