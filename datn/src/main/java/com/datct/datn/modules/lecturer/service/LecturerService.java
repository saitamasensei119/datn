package com.datct.datn.modules.lecturer.service;

import com.datct.datn.modules.lecturer.DTO.CreateLecturerRequest;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {

    private final LecturerRepository lecturerRepository;

    private final UserRepository userRepository;

    private final DepartmentRepository departmentRepository;

    public LecturerResponse create(
            CreateLecturerRequest request
    ) {

        boolean exists =
                lecturerRepository
                        .existsByLecturerCode(
                                request.getLecturerCode()
                        );

        if (exists) {
            throw new RuntimeException(
                    "Lecturer code already exists"
            );
        }

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Department not found"
                        )
                );

        User user = new User();

        user.setFullName(
                request.getFullName()
        );

        user.setEmail(
                request.getEmail()
        );

        user.setPassword(
                request.getPassword()
        );

        user.setRole("LECTURER");

        User savedUser =
                userRepository.save(user);

        Lecturer lecturer = new Lecturer();

        lecturer.setLecturerCode(
                request.getLecturerCode()
        );

        lecturer.setUser(savedUser);

        lecturer.setDepartment(department);

        Lecturer savedLecturer =
                lecturerRepository.save(lecturer);

        return mapToResponse(savedLecturer);
    }

    public List<LecturerResponse> getAll() {

        return lecturerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public LecturerResponse getById(Long id) {

        Lecturer lecturer =
                lecturerRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Lecturer not found"
                                )
                        );

        return mapToResponse(lecturer);
    }

    public LecturerResponse update(
            Long id,
            UpdateLecturerRequest request
    ) {

        Lecturer lecturer =
                lecturerRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Lecturer not found"
                                )
                        );

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Department not found"
                        )
                );

        lecturer.setLecturerCode(
                request.getLecturerCode()
        );

        lecturer.setDepartment(department);

        User user = lecturer.getUser();

        user.setFullName(
                request.getFullName()
        );

        user.setEmail(
                request.getEmail()
        );

        userRepository.save(user);

        Lecturer updated =
                lecturerRepository.save(lecturer);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        Lecturer lecturer =
                lecturerRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Lecturer not found"
                                )
                        );

        userRepository.delete(
                lecturer.getUser()
        );
    }

    private LecturerResponse mapToResponse(
            Lecturer lecturer
    ) {

        return new LecturerResponse(
                lecturer.getId(),
                lecturer.getLecturerCode(),
                lecturer.getUser().getFullName(),
                lecturer.getUser().getEmail(),
                lecturer.getDepartment() != null
                        ? lecturer.getDepartment().getName()
                        : null
        );
    }
}
