package com.datct.datn.modules.student.controller;

import com.datct.datn.modules.student.DTO.StudentDashboardStatsResponse;
import com.datct.datn.modules.student.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/dashboard")
@RequiredArgsConstructor
public class StudentDashboardController {

    private final StudentDashboardService studentDashboardService;

    @GetMapping("/summary")
    public StudentDashboardStatsResponse getSummary() {
        return studentDashboardService.getDashboardStats();
    }
}
