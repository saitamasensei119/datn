package com.datct.datn.modules.grade.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.grade.DTO.StudentGradeResponse;
import com.datct.datn.modules.grade.DTO.UpdateGradeRequest;
import com.datct.datn.modules.grade.entity.Grade;
import com.datct.datn.modules.grade.entity.GradeComponent;
import com.datct.datn.modules.grade.repository.GradeComponentRepository;
import com.datct.datn.modules.grade.repository.GradeRepository;
import com.datct.datn.modules.grade.entity.GradeSubmission;
import com.datct.datn.modules.grade.repository.GradeSubmissionRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.grade.DTO.StudentGradeViewResponse;
import com.datct.datn.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepository gradeRepository;
    private final GradeComponentRepository gradeComponentRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;

    private Lecturer getCurrentLecturer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        return lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private void verifyCourseOwnership(Long courseId, Lecturer lecturer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (course.getLecturer() == null || !course.getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("You do not have permission to manage this course");
        }
    }

    @Transactional(readOnly = true)
    public List<StudentGradeResponse> getGradesForCourse(Long courseId) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        
        return enrollments.stream().map(enrollment -> {
            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElse(null);
            return StudentGradeResponse.builder()
                    .enrollmentId(enrollment.getId())
                    .studentCode(enrollment.getStudent().getStudentCode())
                    .fullName(enrollment.getStudent().getUser().getFullName())
                    .midtermScore(grade != null ? grade.getMidtermScore() : null)
                    .finalScore(grade != null ? grade.getFinalScore() : null)
                    .totalScore(grade != null ? grade.getTotalScore() : null)
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<StudentGradeViewResponse> getGradesForCurrentStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        return enrollments.stream().map(enrollment -> {
            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElse(null);
            
            GradeSubmission midtermSub = gradeSubmissionRepository.findByCourseIdAndGradeType(enrollment.getCourse().getId(), "MIDTERM").orElse(null);
            GradeSubmission finalSub = gradeSubmissionRepository.findByCourseIdAndGradeType(enrollment.getCourse().getId(), "FINAL").orElse(null);

            Double midtermScore = grade != null ? grade.getMidtermScore() : null;
            String midtermStatus = (midtermSub != null && "SUBMITTED".equals(midtermSub.getStatus())) 
                    ? "Đã gửi ban đào tạo" : "Chưa gửi ban đào tạo";

            Double finalScore = grade != null ? grade.getFinalScore() : null;
            String finalStatus = (finalSub != null && "SUBMITTED".equals(finalSub.getStatus())) 
                    ? "Đã gửi ban đào tạo" : "Chưa gửi ban đào tạo";
            Double totalScore = grade != null ? grade.getTotalScore() : null;

            return StudentGradeViewResponse.builder()
                    .courseId(enrollment.getCourse().getId())
                    .courseCode(enrollment.getCourse().getCourseCode())
                    .subjectName(enrollment.getCourse().getSubject().getName())
                    .credits(enrollment.getCourse().getSubject().getCredits())
                    .midtermScore(midtermScore)
                    .midtermStatus(midtermStatus)
                    .finalScore(finalScore)
                    .finalStatus(finalStatus)
                    .totalScore(totalScore)
                    .status(enrollment.getCourse().getStatus() != null ? enrollment.getCourse().getStatus().name() : null)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updateGradesForCourse(Long courseId, List<UpdateGradeRequest> requests) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);

        GradeComponent gradeComponent = gradeComponentRepository.findByCourseId(courseId)
                .orElseThrow(() -> new RuntimeException("Grade component not found for this course"));
        Double midtermWeight = gradeComponent.getMidtermWeight();

        for (UpdateGradeRequest request : requests) {
            Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                    .orElseThrow(() -> new RuntimeException("Enrollment not found for id: " + request.getEnrollmentId()));

            if (!enrollment.getCourse().getId().equals(courseId)) {
                throw new RuntimeException("Enrollment does not belong to this course");
            }

            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                    .orElseGet(() -> {
                        Grade newGrade = new Grade();
                        newGrade.setEnrollment(enrollment);
                        return newGrade;
                    });

            GradeSubmission midtermSub = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "MIDTERM").orElse(null);
            GradeSubmission finalSub = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "FINAL").orElse(null);

            if (request.getMidtermScore() != null) {
                if (midtermSub != null && "SUBMITTED".equals(midtermSub.getStatus())) {
                    throw new RuntimeException("Midterm grades are locked and cannot be updated");
                }
                grade.setMidtermScore(request.getMidtermScore());
            }
            if (request.getFinalScore() != null) {
                if (finalSub != null && "SUBMITTED".equals(finalSub.getStatus())) {
                    throw new RuntimeException("Final grades are locked and cannot be updated");
                }
                grade.setFinalScore(request.getFinalScore());
            }

            if (request.getMidtermScore() != null && request.getFinalScore() != null) {
                double total = request.getMidtermScore() * midtermWeight + request.getFinalScore() * (1.0 - midtermWeight);
                // Round to 2 decimal places
                total = Math.round(total * 100.0) / 100.0;
                grade.setTotalScore(total);
            } else {
                grade.setTotalScore(null);
            }

            gradeRepository.save(grade);
        }
    }

    @Transactional(readOnly = true)
    public List<com.datct.datn.modules.grade.DTO.GradeSubmissionResponse> getSubmissionsForCourse(Long courseId) {
        return gradeSubmissionRepository.findByCourseId(courseId).stream()
                .map(sub -> com.datct.datn.modules.grade.DTO.GradeSubmissionResponse.builder()
                        .gradeType(sub.getGradeType())
                        .status(sub.getStatus())
                        .build())
                .toList();
    }

    @Transactional
    public void submitMidtermGrades(Long courseId) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);
        GradeSubmission submission = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "MIDTERM")
                .orElseThrow(() -> new RuntimeException("Midterm submission not found"));
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setLockedAt(LocalDateTime.now());
        gradeSubmissionRepository.save(submission);
    }

    @Transactional
    public void submitFinalGrades(Long courseId) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);
        GradeSubmission submission = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "FINAL")
                .orElseThrow(() -> new RuntimeException("Final submission not found"));
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setLockedAt(LocalDateTime.now());
        gradeSubmissionRepository.save(submission);
    }

    @Transactional
    public void unlockMidtermGrades(Long courseId) {
        GradeSubmission submission = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "MIDTERM")
                .orElseThrow(() -> new RuntimeException("Midterm submission not found"));
        submission.setStatus("NOT_SUBMITTED");
        submission.setLockedAt(null);
        gradeSubmissionRepository.save(submission);
    }

    @Transactional
    public void unlockFinalGrades(Long courseId) {
        GradeSubmission submission = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "FINAL")
                .orElseThrow(() -> new RuntimeException("Final submission not found"));
        submission.setStatus("NOT_SUBMITTED");
        submission.setLockedAt(null);
        gradeSubmissionRepository.save(submission);
    }
}
