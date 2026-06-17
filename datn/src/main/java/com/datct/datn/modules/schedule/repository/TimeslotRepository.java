package com.datct.datn.modules.schedule.repository;

import com.datct.datn.modules.schedule.entity.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;

@Repository
public interface TimeslotRepository extends JpaRepository<Timeslot, Long> {
    boolean existsByDayOfWeekAndStartTimeAndEndTime(Integer dayOfWeek, LocalTime startTime, LocalTime endTime);
}
