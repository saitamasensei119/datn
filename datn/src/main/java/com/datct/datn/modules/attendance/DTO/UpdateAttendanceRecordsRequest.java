package com.datct.datn.modules.attendance.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRecordsRequest {

    @NotEmpty(message = "Danh sách cập nhật điểm danh không được để trống")
    @Valid
    private List<AttendanceRecordUpdateRequest> records;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceRecordUpdateRequest {
        @NotNull(message = "ID bản ghi điểm danh không được để trống")
        private Long recordId;

        @NotNull(message = "Trạng thái điểm danh không được để trống")
        @Pattern(regexp = "^(PRESENT|ABSENT|LATE|EXCUSED)$", message = "Trạng thái điểm danh chỉ chấp nhận: PRESENT, ABSENT, LATE, hoặc EXCUSED")
        private String status;

        private String note;
    }
}
