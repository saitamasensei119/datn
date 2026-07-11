package com.datct.datn.modules.lecturer.controller;

import com.datct.datn.modules.lecturer.DTO.CreateLecturerRequest;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.service.LecturerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class LecturerController {

    private final LecturerService lecturerService;

    @GetMapping("/me")
    public LecturerResponse getMyProfile() {

        return lecturerService.getMyProfile();
    }

    @PutMapping("/me")
    public LecturerResponse updateMyProfile(
            @RequestBody
            UpdateLecturerRequest request
    ) {

        return lecturerService
                .updateMyProfile(request);
    }

}
