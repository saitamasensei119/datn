package com.datct.datn.modules.schedule.service;

import com.datct.datn.modules.schedule.DTO.TimeslotRequest;
import com.datct.datn.modules.schedule.DTO.TimeslotResponse;
import com.datct.datn.modules.schedule.entity.Timeslot;
import com.datct.datn.modules.schedule.repository.TimeslotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class TimeslotService {
    private final TimeslotRepository timeslotRepository;

    public List<TimeslotResponse> getAllTimeslots() {
        return timeslotRepository.findAll().stream()
                .map(TimeslotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<TimeslotResponse> getTimeslots(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("dayOfWeek").ascending().and(org.springframework.data.domain.Sort.by("startTime").ascending()));
        return timeslotRepository.findAll(pageable)
                .map(TimeslotResponse::fromEntity);
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

    @Transactional
    public void autoGenerateTimeslots() {
        String data = "0645-0910 0920-1145 1505-1730 1500-1700 1230-1455 1505-1645 1230-1400 0730-1145 1410-1730 0645-1005 1015-1145 0825-1145 1315-1730 1230-1550 1410-1550 1600-1730 0825-1005 0645-0815 0730-0910 1315-1645 0645-1145 1230-1730 1230-1645 1315-1400 0825-0910 0825-1100 0900-1100 0700-0900 1300-1500 1245-1500 1500-1715 0800-1100 1400-1700 0800-0930 0930-1100 0920-1100 1400-1530 1530-1700 0800-1000 1330-1530 1330-1500 1500-1630 0830-1100 1330-1600 0730-1100 1330-1700 0800-1130 1000-1200 1315-1455 1300-1600 0830-1130 0940-1110 1300-1430 1440-1610 0910-1110 1510-1710 0700-0915 0915-1130 1230-1630 0730-1130 1230-1545 1245-1455 0730-0930 0935-1135 0920-1120 1505-1705 1410-1645 0930-1130 1800-2000 1250-1450 0915-1150 0715-0910 1300-1700 1800-1930 1930-2100 0730-1005 1745-2010 0815-1115 1315-1615 1315-1715 0645-1130 1230-1530 1315-1500 1515-1600 1615-1715 0845-1145 1330-1630 0730-1645 0645-0915 0915-1145 1230-1500 1500-1730 1830-2130 1830-2100 1230-1450 0920-1135 1800-2100 1830-2000 0645-1100 0645-1105 1250-1710 1250-1610 1620-1710 1015-1105 0825-1645 1300-1710 1645-1745 1400-1500 1530-1630 0645-0745 0800-0900 0915-1015 0710-0915 0915-1125 1300-1505 1505-1710 0920-1125 1745-2200 1505-1740 1315-1550 1320-1730 0735-1145";
        String[] pairs = data.split(" ");
        
        for (int day = 1; day <= 7; day++) {
            for (String pair : pairs) {
                if (pair.trim().isEmpty()) continue;
                String[] parts = pair.split("-");
                if (parts.length == 2) {
                    try {
                        LocalTime start = LocalTime.of(Integer.parseInt(parts[0].substring(0, 2)), Integer.parseInt(parts[0].substring(2, 4)));
                        LocalTime end = LocalTime.of(Integer.parseInt(parts[1].substring(0, 2)), Integer.parseInt(parts[1].substring(2, 4)));
                        
                        if (!timeslotRepository.existsByDayOfWeekAndStartTimeAndEndTime(day, start, end)) {
                            Timeslot ts = new Timeslot();
                            ts.setDayOfWeek(day);
                            ts.setStartTime(start);
                            ts.setEndTime(end);
                            timeslotRepository.save(ts);
                        }
                    } catch (Exception e) {
                        // Bỏ qua lỗi parsing nếu có
                    }
                }
            }
        }
    }
}
