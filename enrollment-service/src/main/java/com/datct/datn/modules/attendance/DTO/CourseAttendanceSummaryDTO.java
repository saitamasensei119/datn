package com.datct.datn.modules.attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseAttendanceSummaryDTO {
    private Long courseId;
    private String courseCode;
    private String subjectName;
    private int totalSessions;
    private int present;
    private int absent;
    private int late;
    private int excused;
}
