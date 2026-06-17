package com.datct.datn.modules.schedule.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimeslotRequest {
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
