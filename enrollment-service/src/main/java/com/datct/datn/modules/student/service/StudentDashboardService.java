package com.datct.datn.modules.student.service;

import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.grade.entity.StudentSubjectResult;
import com.datct.datn.modules.grade.repository.StudentSubjectResultRepository;
import com.datct.datn.modules.student.DTO.StudentDashboardStatsResponse;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentDashboardService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentSubjectResultRepository studentSubjectResultRepository;

    @Transactional(readOnly = true)
    public StudentDashboardStatsResponse getDashboardStats() {
        Long userId = SecurityUtil.getCurrentUserId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Get enrollments to count in-progress courses
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        int enrolledCourses = 0;
        for (Enrollment e : enrollments) {
            CourseStatus status = e.getCourse().getStatus();
            if (status == CourseStatus.IN_PROGRESS || status == CourseStatus.OPEN || status == CourseStatus.PLANNED) {
                enrolledCourses++;
            }
        }

        // Get student subject results to calculate GPA, completed courses, and credits
        List<StudentSubjectResult> results = studentSubjectResultRepository.findByStudentId(student.getId());
        
        int completedCourses = 0;
        int totalCredits = 0;
        double totalWeightedGpa = 0.0;
        int creditsForGpa = 0;

        for (StudentSubjectResult result : results) {
            completedCourses++;
            int credits = result.getSubject().getCredits();
            
            if (Boolean.TRUE.equals(result.getIsPassed())) {
                totalCredits += credits;
            }

            if (result.getGradePoint() != null) {
                totalWeightedGpa += result.getGradePoint() * credits;
                creditsForGpa += credits;
            }
        }

        double gpa = creditsForGpa > 0 ? totalWeightedGpa / creditsForGpa : 0.0;

        return StudentDashboardStatsResponse.builder()
                .enrolledCourses(enrolledCourses)
                .completedCourses(completedCourses)
                .credits(totalCredits)
                .gpa(gpa)
                .build();
    }
}
