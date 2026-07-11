package com.datct.datn.modules.schedule.DTO;

import com.datct.datn.modules.schedule.entity.Timeslot;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimeslotResponse {
    private Long id;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public static TimeslotResponse fromEntity(Timeslot timeslot) {
        return new TimeslotResponse(
                timeslot.getId(),
                timeslot.getDayOfWeek(),
                timeslot.getStartTime(),
                timeslot.getEndTime()
        );
    }
}
