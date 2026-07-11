package com.datct.datn.modules.student.service;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.lecturer.DTO.LecturerResponse;
import com.datct.datn.modules.lecturer.DTO.UpdateLecturerRequest;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.student.DTO.StudentRequest;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.DTO.StudentStatusCountResponse;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.entity.StudentStatus;
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
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final DepartmentRepository departmentRepository;
        @Transactional
        public StudentResponse create(StudentRequest request) {

            // 1️⃣ Kiểm tra email đã tồn tại chưa
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }

            // 2️⃣ Tìm department
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));

            // 3️⃣ Tạo user mới, encode password
            User user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(Role.STUDENT);

            User savedUser = userRepository.save(user);

            // 4️⃣ Tạo student
            Student student = new Student();
            student.setStudentCode(request.getStudentCode());
            student.setUser(savedUser);
            student.setDepartment(department);
            student.setPersonalEmail(request.getPersonalEmail());
            student.setPhoneNumber(request.getPhoneNumber());

            Student savedStudent = studentRepository.save(student);

            // 5️⃣ Map entity sang DTO trả về
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

    public StudentResponse getByStudentCode(String studentCode ) {

        Student student =
                studentRepository.findByStudentCode(studentCode)
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

        student.setStatus(request.getStatus());
        student.setPersonalEmail(request.getPersonalEmail());
        student.setPhoneNumber(request.getPhoneNumber());

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
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getStudentCode(),
                student.getDepartment() != null
                        ? student.getDepartment().getId()
                        : null,
                student.getDepartment() != null ? student.getDepartment().getName() : null,
                student.getStatus(),
                student.getPersonalEmail(),
                student.getPhoneNumber()
        );
    }

    public StudentStatusCountResponse getStudentStatistics() {
        long active = 0;
        long suspended = 0;

        for (Object[] row : studentRepository.countGroupByStatus()) {
            StudentStatus status = (StudentStatus) row[0];
            Long count = (Long) row[1];

            if (status == StudentStatus.ACTIVE) {
                active = count;
            } else if (status == StudentStatus.SUSPENDED) {
                suspended = count;
            }
        }

        return new StudentStatusCountResponse(active, suspended);
    }

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .map(student -> new StudentResponse(
                        student.getId(),
                        student.getUser().getFullName(),
                        student.getUser().getEmail(),
                        student.getStudentCode(),
                        student.getDepartment() != null ? student.getDepartment().getId() : null,
                        student.getDepartment() != null ? student.getDepartment().getName() : null,
                        student.getStatus(),
                        student.getPersonalEmail(),
                        student.getPhoneNumber()
                ))
                .toList();
    }

    public org.springframework.data.domain.Page<StudentResponse> getPaginated(int page, int size, String search) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("id").descending());
        org.springframework.data.domain.Page<Student> studentPage = studentRepository.findPaginated(search != null ? search : "", pageable);
        return studentPage.map(this::mapToResponse);
    }

    @Transactional
    public StudentResponse updateMyProfile(
            StudentRequest request
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();

        User currentUser =
                userDetails.getUser();

        Student student =
                studentRepository
                        .findByUserId(
                                currentUser.getId()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Student not found"
                                )
                        );

        currentUser.setFullName(
                request.getFullName()
        );


        userRepository.save(currentUser);

        student.setPersonalEmail(request.getPersonalEmail());
        student.setPhoneNumber(request.getPhoneNumber());
        student = studentRepository.save(student);

        return mapToResponse(student);
    }

    @Transactional(readOnly = true)
    public StudentResponse getMyProfile() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();

        Long userId =
                userDetails.getUser().getId();

        Student student =
                studentRepository.findByUserId(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Lecturer not found"
                                )
                        );

        return mapToResponse(student);
    }


}

