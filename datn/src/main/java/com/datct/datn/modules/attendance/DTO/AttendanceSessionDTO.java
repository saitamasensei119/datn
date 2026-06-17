package com.datct.datn.modules.attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSessionDTO {
    private Long id;
    private Long courseId;
    private LocalDate sessionDate;
    private String note;
}
