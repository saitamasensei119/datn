package com.datct.datn.modules.student.service;

import com.datct.datn.modules.student.DTO.StudentRequest;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    private final DepartmentRepository departmentRepository;

    @Transactional
    public StudentResponse create(
            StudentRequest request
    ) {

        Department department =
                departmentRepository.findById(
                        request.getDepartmentId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Department not found"
                        )
                );

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(Role.valueOf("STUDENT"));

        User savedUser = userRepository.save(user);

        Student student = new Student();

        student.setStudentCode(
                request.getStudentCode()
        );

        student.setCreatedAt(LocalDateTime.now());

        student.setUser(savedUser);

        student.setDepartment(department);

        Student savedStudent =
                studentRepository.save(student);

        return mapToResponse(savedStudent);
    }

    public StudentResponse getById(Long id) {

        Student student =
                studentRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Student not found"
                                )
                        );

        return mapToResponse(student);
    }

    @Transactional
    public StudentResponse update(
            Long id,
            StudentRequest request
    ) {

        Student student =
                studentRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Student not found"
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

        // update student
        student.setStudentCode(
                request.getStudentCode()
        );

        student.setDepartment(department);

        // update user
        User user = student.getUser();

        user.setFullName(
                request.getFullName()
        );

        user.setEmail(
                request.getEmail()
        );

        Student updated =
                studentRepository.save(student);

        return mapToResponse(updated);
    }
    private StudentResponse mapToResponse(
            Student student
    ) {

        return new StudentResponse(
                student.getId(),
                student.getStudentCode(),
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getDepartment() != null
                        ? student.getDepartment().getName()
                        : null
        );
    }


}

