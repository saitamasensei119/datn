package com.datct.datn.modules.student.DTO;

public record StudentStatusCountResponse(
        long activeCount,
        long suspendedCount
) {
}
