package com.datct.datn.modules.enrollment.service;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.course.DTO.StudentCourseResponse;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public void enroll(EnrollmentRequest request) {

        // check already enrolled
        boolean exists =
                enrollmentRepository
                        .existsByStudentIdAndCourseId(
                                request.getStudentId(),
                                request.getCourseId()
                        );

        if (exists) {
            throw new RuntimeException(
                    "Student already enrolled"
            );
        }

        Student student =
                studentRepository.findById(
                        request.getStudentId()
                ).orElseThrow(() -> new RuntimeException("Student not found"));

        Course course =
                courseRepository.findById(
                        request.getCourseId()
                ).orElseThrow(() -> new RuntimeException("Course not found"));

        long currentStudents =
                enrollmentRepository.countByCourseId(
                        course.getId()
                );

        if (currentStudents >= course.getMaxStudents()) {
            throw new RuntimeException("Course is full");
        }

        Enrollment enrollment = new Enrollment();

        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());

        enrollmentRepository.save(enrollment);
    }
    @Transactional
    public void studentEnroll(EnrollmentRequest request) {
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
                                        "Student not found"
                                )
                        );


        Course course =
                courseRepository.findById(
                        request.getCourseId()
                ).orElseThrow(() -> new RuntimeException("Course not found"));

        // check already enrolled
        boolean exists =
                enrollmentRepository
                        .existsByStudentIdAndCourseId(
                                student.getId(),
                                request.getCourseId()
                        );

        if (exists) {
            throw new RuntimeException(
                    "Student already enrolled"
            );
        }

        long currentStudents =
                enrollmentRepository.countByCourseId(
                        course.getId()
                );

        if (currentStudents >= course.getMaxStudents()) {
            throw new RuntimeException("Course is full");
        }

        Enrollment enrollment = new Enrollment();

        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());

        enrollmentRepository.save(enrollment);
    }
    public List<StudentCourseResponse> getStudentEnroll() {

        Long userId = SecurityUtil.getCurrentUserId();

        Student student =
                studentRepository.findByUserId(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Student not found"
                                )
                        );

        List<Course> courses =
                enrollmentRepository
                        .findCoursesByStudentId(
                                student.getId()
                        );

        return courses.stream()
                .map(course ->
                        new StudentCourseResponse(
                                course.getId(),
                                course.getCourseCode(),
                                course.getSubject().getName(),
                                course.getMaxStudents(),
                                course.getStatus()
                        )
                )
                .toList();
    }

    @Transactional
    public void unenroll(Long courseId) {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();

        Long userId = userDetails.getUser().getId();
        Student student =
                studentRepository.findByUserId(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Student not found"
                                )
                        );

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

            if (enrollment.getCourse().getStatus() != CourseStatus.OPEN) {
                    throw new RuntimeException("Chỉ có thể hủy lớp khi lớp học phần đang ở trạng thái OPEN (Mở đăng ký)");
        }

        enrollmentRepository.delete(enrollment);
    }

    @Transactional
    public void unenrollByAdmin(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        // No status check for admin
        enrollmentRepository.delete(enrollment);
    }
}
