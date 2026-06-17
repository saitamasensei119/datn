package com.datct.datn.modules.schedule.controller;

import com.datct.datn.modules.schedule.DTO.TimeslotRequest;
import com.datct.datn.modules.schedule.DTO.TimeslotResponse;
import com.datct.datn.modules.schedule.service.TimeslotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
@RestController
@RequestMapping("/api/admin/timeslots")
@RequiredArgsConstructor
public class AdminTimeslotController {
    private final TimeslotService timeslotService;

    @GetMapping
    public List<TimeslotResponse> getAllTimeslots() {
        return timeslotService.getAllTimeslots();
    }

    @GetMapping("/page")
    public Page<TimeslotResponse> getTimeslots(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return timeslotService.getTimeslots(page, size);
    }

    @PostMapping
    public TimeslotResponse createTimeslot(@RequestBody TimeslotRequest request) {
        return timeslotService.createTimeslot(request);
    }

    @PutMapping("/{id}")
    public TimeslotResponse updateTimeslot(@PathVariable Long id, @RequestBody TimeslotRequest request) {
        return timeslotService.updateTimeslot(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteTimeslot(@PathVariable Long id) {
        timeslotService.deleteTimeslot(id);
    }

    @PostMapping("/seed")
    public void autoGenerateTimeslots() {
        timeslotService.autoGenerateTimeslots();
    }
}
