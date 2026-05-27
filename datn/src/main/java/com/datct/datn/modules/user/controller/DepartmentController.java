package com.datct.datn.modules.user.controller;

import com.datct.datn.modules.user.DTO.CreateDepartmentRequest;
import com.datct.datn.modules.user.DTO.DepartmentResponse;
import com.datct.datn.modules.user.DTO.UpdateDepartmentRequest;
import com.datct.datn.modules.user.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public DepartmentResponse create(
            @RequestBody CreateDepartmentRequest request
    ) {

        return departmentService.create(request);
    }

    @GetMapping
    public List<DepartmentResponse> getAll() {

        return departmentService.getAll();
    }

    @GetMapping("/{id}")
    public DepartmentResponse getById(
            @PathVariable Long id
    ) {

        return departmentService.getById(id);
    }

    @PutMapping("/{id}")
    public DepartmentResponse update(
            @PathVariable Long id,
            @RequestBody UpdateDepartmentRequest request
    ) {

        return departmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        departmentService.delete(id);
    }
}