package com.datct.datn.modules.schedule.service;

import com.datct.datn.modules.schedule.DTO.TimeslotRequest;
import com.datct.datn.modules.schedule.DTO.TimeslotResponse;
import com.datct.datn.modules.schedule.entity.Timeslot;
import com.datct.datn.modules.schedule.repository.TimeslotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeslotService {
    private final TimeslotRepository timeslotRepository;

    public List<TimeslotResponse> getAllTimeslots() {
        return timeslotRepository.findAll().stream()
                .map(TimeslotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public TimeslotResponse createTimeslot(TimeslotRequest request) {
        if (timeslotRepository.existsByDayOfWeekAndStartTimeAndEndTime(
                request.getDayOfWeek(), request.getStartTime(), request.getEndTime())) {
            throw new RuntimeException("Ca học này đã tồn tại");
        }

        Timeslot timeslot = new Timeslot();
        timeslot.setDayOfWeek(request.getDayOfWeek());
        timeslot.setStartTime(request.getStartTime());
        timeslot.setEndTime(request.getEndTime());

        return TimeslotResponse.fromEntity(timeslotRepository.save(timeslot));
    }

    @Transactional
    public TimeslotResponse updateTimeslot(Long id, TimeslotRequest request) {
        Timeslot timeslot = timeslotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ca học"));

        if ((!timeslot.getDayOfWeek().equals(request.getDayOfWeek()) ||
             !timeslot.getStartTime().equals(request.getStartTime()) ||
             !timeslot.getEndTime().equals(request.getEndTime())) &&
            timeslotRepository.existsByDayOfWeekAndStartTimeAndEndTime(
                request.getDayOfWeek(), request.getStartTime(), request.getEndTime())) {
            throw new RuntimeException("Ca học này đã tồn tại");
        }

        timeslot.setDayOfWeek(request.getDayOfWeek());
        timeslot.setStartTime(request.getStartTime());
        timeslot.setEndTime(request.getEndTime());

        return TimeslotResponse.fromEntity(timeslotRepository.save(timeslot));
    }

    @Transactional
    public void deleteTimeslot(Long id) {
        if (!timeslotRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy ca học");
        }
        timeslotRepository.deleteById(id);
    }
}
