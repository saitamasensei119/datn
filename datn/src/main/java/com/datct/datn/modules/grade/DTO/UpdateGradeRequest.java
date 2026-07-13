package com.datct.datn.modules.grade.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateGradeRequest {
    @NotNull(message = "ID bản ghi ghi danh (enrollmentId) không được để trống")
    private Long enrollmentId;

    @Min(value = 0, message = "Điểm giữa kỳ không được nhỏ hơn 0")
    @Max(value = 10, message = "Điểm giữa kỳ không được lớn hơn 10")
    private Double midtermScore;

    @Min(value = 0, message = "Điểm cuối kỳ không được nhỏ hơn 0")
    @Max(value = 10, message = "Điểm cuối kỳ không được lớn hơn 10")
    private Double finalScore;
}
