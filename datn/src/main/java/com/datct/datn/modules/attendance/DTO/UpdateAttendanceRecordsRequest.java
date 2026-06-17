package com.datct.datn.modules.attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRecordsRequest {
    private List<AttendanceRecordUpdateRequest> records;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceRecordUpdateRequest {
        private Long recordId;
        private String status;
        private String note;
    }
}
