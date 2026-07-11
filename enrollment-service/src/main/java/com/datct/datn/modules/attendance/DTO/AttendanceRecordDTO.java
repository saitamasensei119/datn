package com.datct.datn.modules.attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecordDTO {
    private Long id;
    private Long attendanceSessionId;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String status;
    private String note;
}
