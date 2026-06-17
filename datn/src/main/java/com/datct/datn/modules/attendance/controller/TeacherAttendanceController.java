package com.datct.datn.modules.attendance.controller;

import com.datct.datn.modules.attendance.DTO.AttendanceRecordDTO;
import com.datct.datn.modules.attendance.DTO.AttendanceSessionDTO;
import com.datct.datn.modules.attendance.DTO.UpdateAttendanceRecordsRequest;
import com.datct.datn.modules.attendance.service.TeacherAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherAttendanceController {

    private final TeacherAttendanceService teacherAttendanceService;

    @GetMapping("/courses/{courseId}/attendance-sessions")
    public List<AttendanceSessionDTO> getSessions(@PathVariable Long courseId) {
        return teacherAttendanceService.getSessionsByCourse(courseId);
    }

    @PostMapping("/courses/{courseId}/attendance-sessions")
    public AttendanceSessionDTO getOrCreateSession(
            @PathVariable Long courseId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return teacherAttendanceService.getOrCreateSession(courseId, date);
    }

    @GetMapping("/attendance-sessions/{sessionId}/records")
    public List<AttendanceRecordDTO> getRecords(@PathVariable Long sessionId) {
        return teacherAttendanceService.getRecordsBySession(sessionId);
    }

    @PutMapping("/attendance-sessions/{sessionId}/records")
    public void updateRecords(
            @PathVariable Long sessionId,
            @RequestBody UpdateAttendanceRecordsRequest request) {
        teacherAttendanceService.updateRecords(sessionId, request);
    }
}
