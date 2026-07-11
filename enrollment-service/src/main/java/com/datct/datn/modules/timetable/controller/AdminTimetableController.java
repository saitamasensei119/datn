package com.datct.datn.modules.timetable.controller;

import com.datct.datn.modules.timetable.DTO.TimetableDTOs.AhpWeightRequest;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.AhpWeightResponse;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.GenerateCoursesRequest;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.ScheduleRequest;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.TimetableResponse;
import com.datct.datn.modules.timetable.service.AhpWeightService;
import com.datct.datn.modules.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/timetable")
@RequiredArgsConstructor
public class AdminTimetableController {

    private final TimetableService timetableService;
    private final AhpWeightService ahpWeightService;

    @PostMapping("/generate-courses")
    public ResponseEntity<TimetableResponse> generateCourses(@RequestBody GenerateCoursesRequest request) {
        TimetableResponse response = timetableService.generateCoursesFromDemand(
                request.getSemesterId(),
                request.getDefaultMaxStudents() != null ? request.getDefaultMaxStudents() : 40
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-ahp")
    public ResponseEntity<AhpWeightResponse> calculateAhpWeights(@RequestBody(required = false) AhpWeightRequest request) {
        AhpWeightResponse response = ahpWeightService.calculateWeights(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedule")
    public ResponseEntity<TimetableResponse> scheduleCourses(@RequestBody ScheduleRequest request) {
        TimetableResponse response = timetableService.scheduleCoursesWithORTools(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam Long semesterId) {
        byte[] excelData = timetableService.exportTimetableExcel(semesterId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "ThoiKhoaBieu_HocKy_" + semesterId + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(excelData);
    }
}
