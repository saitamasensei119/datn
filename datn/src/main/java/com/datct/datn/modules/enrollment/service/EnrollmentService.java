package com.datct.datn.modules.enrollment.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
                ).orElseThrow();

        Course course =
                courseRepository.findById(
                        request.getCourseId()
                ).orElseThrow();

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
}
