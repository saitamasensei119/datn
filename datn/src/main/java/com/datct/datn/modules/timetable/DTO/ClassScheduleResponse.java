package com.datct.datn.modules.timetable.DTO;

public record ClassScheduleResponse(
        Long id,
        Integer sessionNumber,
        Integer dayOfWeek,
        Integer startPeriod,
        Integer endPeriod,
        String shift,
        String timeString,
        String weekPattern,
        String roomName
) {
}
