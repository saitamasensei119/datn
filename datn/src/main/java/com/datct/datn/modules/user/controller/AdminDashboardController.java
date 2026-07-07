package com.datct.datn.modules.user.controller;

import com.datct.datn.modules.user.DTO.AdminDashboardStatsResponse;
import com.datct.datn.modules.user.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/overview")
    public AdminDashboardStatsResponse getOverview() {
        return adminDashboardService.getOverviewStats();
    }
}
