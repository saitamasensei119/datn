package com.datct.datn.modules.lecturer.service;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.lecturer.DTO.CreateLecturerRequest;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {

    private final LecturerRepository lecturerRepository;

    private final UserRepository userRepository;

    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;

    @Transactional
    public LecturerResponse createLecturer(
            CreateLecturerRequest request
    ) {

        if (userRepository.findByEmail(
                request.getEmail()
        ).isPresent()) {

            throw new RuntimeException(
                    "Email already exists"
            );
        }

        if (lecturerRepository.existsByLecturerCode(
                request.getLecturerCode()
        )) {

            throw new RuntimeException(
                    "Lecturer code already exists"
            );
        }

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Department not found"
                        )
                );

        User user = new User();

        user.setFullName(request.getFullName());

        user.setEmail(request.getEmail());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(Role.TEACHER);

        user = userRepository.save(user);

        Lecturer lecturer = new Lecturer();

        lecturer.setUser(user);

        lecturer.setLecturerCode(
                request.getLecturerCode()
        );

        lecturer.setDepartment(department);
        lecturer.setPersonalEmail(validateAndNormalizePersonalEmail(request.getPersonalEmail(), null));
        lecturer.setPhoneNumber(request.getPhoneNumber());

        lecturer = lecturerRepository.save(lecturer);

        return new LecturerResponse(
                lecturer.getId(),
                lecturer.getLecturerCode(),
                user.getFullName(),
                user.getEmail(),
                department.getName(),
                lecturer.getStatus(),
                lecturer.getPersonalEmail(),
                lecturer.getPhoneNumber()
        );
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

    public long countLecturers() {
        return lecturerRepository.count();
    }


    @Transactional
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

        User user = lecturer.getUser();

        user.setFullName(
                request.getFullName()
        );

        user.setEmail(
                request.getEmail()
        );

        user.setEnabled(
                request.getEnabled()
        );

        lecturer.setLecturerCode(
                request.getLecturerCode()
        );

        lecturer.setDepartment(
                department
        );

        lecturer.setStatus(
                request.getStatus()
        );

        lecturer.setPersonalEmail(validateAndNormalizePersonalEmail(request.getPersonalEmail(), lecturer.getId()));
        lecturer.setPhoneNumber(request.getPhoneNumber());
        lecturer = lecturerRepository.save(lecturer);

        return mapToResponse(lecturer);
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
                        : null,
                lecturer.getStatus(),
                lecturer.getPersonalEmail(),
                lecturer.getPhoneNumber()
        );
    }

    private String validateAndNormalizePersonalEmail(String personalEmail, Long currentLecturerId) {
        String normalizedEmail = (personalEmail != null && !personalEmail.trim().isEmpty())
                ? personalEmail.trim() : null;
        if (normalizedEmail != null) {
            if (userRepository.findByEmail(normalizedEmail).isPresent()) {
                throw new RuntimeException("Email cá nhân này đã bị trùng với email đăng nhập của một tài khoản khác trong hệ thống");
            }
            if (currentLecturerId == null) {
                if (lecturerRepository.existsByPersonalEmail(normalizedEmail) || studentRepository.existsByPersonalEmail(normalizedEmail)) {
                    throw new RuntimeException("Email cá nhân này đã được sử dụng cho một tài khoản khác trong hệ thống");
                }
            } else {
                if (lecturerRepository.existsByPersonalEmailAndIdNot(normalizedEmail, currentLecturerId) || studentRepository.existsByPersonalEmail(normalizedEmail)) {
                    throw new RuntimeException("Email cá nhân này đã được sử dụng cho một tài khoản khác trong hệ thống");
                }
            }
        }
        return normalizedEmail;
    }
}
