package com.datct.datn.modules.user.DTO;

public record AdminDashboardStatsResponse(
        long activeStudents,
        long suspendedStudents,
        long totalTeachers,
        long totalCourses
) {}
