package com.datct.datn.modules.student.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardStatsResponse {
    private int enrolledCourses;
    private double gpa;
    private int completedCourses;
    private int credits;
}
