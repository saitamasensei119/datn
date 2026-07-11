package com.datct.datn.modules.attendance.controller;

import com.datct.datn.modules.attendance.DTO.CourseAttendanceSummaryDTO;
import com.datct.datn.modules.attendance.DTO.StudentAttendanceDetailDTO;
import com.datct.datn.modules.attendance.service.StudentAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/attendance")
@RequiredArgsConstructor
public class StudentAttendanceController {

    private final StudentAttendanceService studentAttendanceService;

    @GetMapping("/summary")
    public List<CourseAttendanceSummaryDTO> getSummary() {
        return studentAttendanceService.getAttendanceSummary();
    }

    @GetMapping("/courses/{courseId}")
    public List<StudentAttendanceDetailDTO> getDetails(@PathVariable Long courseId) {
        return studentAttendanceService.getAttendanceDetails(courseId);
    }
}
