package com.datct.datn.modules.seed.controller;

import com.datct.datn.modules.seed.service.DataSeederService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// dùng để tạo user ảo
@RestController
@RequestMapping("/api/admin/seed")
public class DataSeederController {

    @Autowired
    private DataSeederService dataSeederService;

    @PostMapping("/pre-registrations")
    public ResponseEntity<?> seedPreRegistrations(
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "500") int numStudents,
            @RequestParam(defaultValue = "5") int maxSubjects) {
        try {
            String result = dataSeederService.seedPreRegistrations(semesterId, numStudents, maxSubjects);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/pre-registrations")
    public ResponseEntity<?> clearSeedData() {
        try {
            String result = dataSeederService.clearSeedData();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
