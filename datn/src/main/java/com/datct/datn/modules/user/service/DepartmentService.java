package com.datct.datn.modules.user.service;

import com.datct.datn.modules.user.DTO.CreateDepartmentRequest;
import com.datct.datn.modules.user.DTO.DepartmentResponse;
import com.datct.datn.modules.user.DTO.UpdateDepartmentRequest;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentResponse create(
            CreateDepartmentRequest request
    ) {

        boolean exists =
                departmentRepository.existsByName(
                        request.getName()
                );

        if (exists) {
            throw new RuntimeException(
                    "Department already exists"
            );
        }

        Department department = new Department();

        department.setName(request.getName());

        Department saved =
                departmentRepository.save(department);

        return mapToResponse(saved);
    }

    public List<DepartmentResponse> getAll() {

        return departmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public DepartmentResponse getById(Long id) {

        Department department =
                departmentRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Department not found"
                                )
                        );

        return mapToResponse(department);
    }

    public DepartmentResponse update(
            Long id,
            UpdateDepartmentRequest request
    ) {

        Department department =
                departmentRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Department not found"
                                )
                        );

        department.setName(request.getName());

        Department updated =
                departmentRepository.save(department);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        departmentRepository.deleteById(id);
    }

    private DepartmentResponse mapToResponse(
            Department department
    ) {

        return new DepartmentResponse(
                department.getId(),
                department.getName()
        );
    }
}
