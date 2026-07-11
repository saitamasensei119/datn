package com.datct.datn.modules.grade.service;

import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.grade.DTO.StudentGradeResponse;
import com.datct.datn.modules.grade.DTO.TranscriptResponse;
import com.datct.datn.modules.grade.DTO.UpdateGradeRequest;
import com.datct.datn.modules.grade.entity.Grade;
import com.datct.datn.modules.grade.entity.GradeComponent;
import com.datct.datn.modules.grade.repository.GradeComponentRepository;
import com.datct.datn.modules.grade.repository.GradeRepository;
import com.datct.datn.modules.grade.entity.GradeSubmission;
import com.datct.datn.modules.grade.repository.GradeSubmissionRepository;
import com.datct.datn.modules.grade.entity.StudentSubjectResult;
import com.datct.datn.modules.grade.repository.StudentSubjectResultRepository;
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

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Iterator;

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
    private final StudentSubjectResultRepository studentSubjectResultRepository;

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

    @Transactional(readOnly = true)
    public List<TranscriptResponse> getTranscriptForCurrentStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<StudentSubjectResult> results = studentSubjectResultRepository.findByStudentId(student.getId());

        return results.stream().map(result -> {
            String semesterName = "";
            if (result.getBestAttemptEnrollment() != null && result.getBestAttemptEnrollment().getCourse() != null && result.getBestAttemptEnrollment().getCourse().getSemester() != null) {
                semesterName = result.getBestAttemptEnrollment().getCourse().getSemester().getName();
            }

            return TranscriptResponse.builder()
                    .semesterName(semesterName)
                    .courseCode(result.getSubject().getSubjectCode())
                    .subjectName(result.getSubject().getName())
                    .credits(result.getSubject().getCredits())
                    .totalScore(result.getFinalScore())
                    .gradePoint(result.getGradePoint())
                    .letterGrade(result.getLetterGrade())
                    .isPassed(result.getIsPassed())
                    .build();
        }).toList();
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
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu: Không tìm thấy trạng thái chốt điểm giữa kỳ của lớp học phần này. Vui lòng liên hệ Admin để xử lý."));

        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setLockedAt(LocalDateTime.now());
        gradeSubmissionRepository.save(submission);

        checkAndProcessSubjectResults(courseId);
    }

    @Transactional
    public void submitFinalGrades(Long courseId) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);

        GradeSubmission finalSub = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "FINAL")
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu: Không tìm thấy trạng thái chốt điểm cuối kỳ của lớp học phần này. Vui lòng liên hệ Admin để xử lý."));

        finalSub.setStatus("SUBMITTED");
        finalSub.setSubmittedAt(LocalDateTime.now());
        finalSub.setLockedAt(LocalDateTime.now());
        gradeSubmissionRepository.save(finalSub);

        checkAndProcessSubjectResults(courseId);
    }

    private void checkAndProcessSubjectResults(Long courseId) {
        boolean bothSubmitted = gradeSubmissionRepository.findByCourseId(courseId).stream()
                .filter(s -> "SUBMITTED".equals(s.getStatus()))
                .count() == 2;
        if (bothSubmitted) {
            processSubjectResults(courseId);
        }
    }

    private void processSubjectResults(Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found"));
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        for (Enrollment enrollment : enrollments) {
            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElse(null);
            if (grade != null && grade.getTotalScore() != null) {
                Student student = enrollment.getStudent();
                StudentSubjectResult result = studentSubjectResultRepository
                        .findByStudentIdAndSubjectId(student.getId(), course.getSubject().getId())
                        .orElse(new StudentSubjectResult());

                if (result.getId() == null || grade.getTotalScore() > result.getFinalScore()) {
                    result.setStudent(student);
                    result.setSubject(course.getSubject());
                    result.setBestAttemptEnrollment(enrollment);
                    result.setFinalScore(grade.getTotalScore());

                    setGradeScale(result, grade.getTotalScore());

                    studentSubjectResultRepository.save(result);
                } else if (result.getBestAttemptEnrollment() != null && result.getBestAttemptEnrollment().getId().equals(enrollment.getId()) && grade.getTotalScore() < result.getFinalScore()) {
                    recalculateBestAttempt(student, course.getSubject());
                }
            }
        }
    }

    private void recalculateBestAttempt(Student student, com.datct.datn.modules.subject.entity.Subject subject) {
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getCourse().getSubject().getId().equals(subject.getId()))
                .toList();

        Enrollment bestEnrollment = null;
        Double maxScore = -1.0;

        for (Enrollment e : allEnrollments) {
            Grade g = gradeRepository.findByEnrollmentId(e.getId()).orElse(null);
            if (g != null && g.getTotalScore() != null) {
                if (g.getTotalScore() > maxScore) {
                    maxScore = g.getTotalScore();
                    bestEnrollment = e;
                }
            }
        }

        if (bestEnrollment != null) {
            StudentSubjectResult result = studentSubjectResultRepository
                    .findByStudentIdAndSubjectId(student.getId(), subject.getId())
                    .orElse(new StudentSubjectResult());
            
            result.setStudent(student);
            result.setSubject(subject);
            result.setBestAttemptEnrollment(bestEnrollment);
            result.setFinalScore(maxScore);
            setGradeScale(result, maxScore);
            studentSubjectResultRepository.save(result);
        }
    }

    private void setGradeScale(StudentSubjectResult result, Double totalScore) {
        if (totalScore >= 9.5) {
            result.setLetterGrade("A+");
            result.setGradePoint(4.0);
            result.setIsPassed(true);
        } else if (totalScore >= 8.5) {
            result.setLetterGrade("A");
            result.setGradePoint(4.0);
            result.setIsPassed(true);
        } else if (totalScore >= 8.0) {
            result.setLetterGrade("B+");
            result.setGradePoint(3.5);
            result.setIsPassed(true);
        } else if (totalScore >= 7.0) {
            result.setLetterGrade("B");
            result.setGradePoint(3.0);
            result.setIsPassed(true);
        } else if (totalScore >= 6.5) {
            result.setLetterGrade("C+");
            result.setGradePoint(2.5);
            result.setIsPassed(true);
        } else if (totalScore >= 5.5) {
            result.setLetterGrade("C");
            result.setGradePoint(2.0);
            result.setIsPassed(true);
        } else if (totalScore >= 5.0) {
            result.setLetterGrade("D+");
            result.setGradePoint(1.5);
            result.setIsPassed(true);
        } else if (totalScore >= 4.0) {
            result.setLetterGrade("D");
            result.setGradePoint(1.0);
            result.setIsPassed(true);
        } else {
            result.setLetterGrade("F");
            result.setGradePoint(0.0);
            result.setIsPassed(false);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateGradeTemplate(Long courseId) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Grades");

            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("Mã Sinh Viên");
            headerRow.createCell(1).setCellValue("Họ và Tên");
            headerRow.createCell(2).setCellValue("Điểm Giữa Kỳ");
            headerRow.createCell(3).setCellValue("Điểm Cuối Kỳ");

            int rowIdx = 1;
            for (Enrollment enrollment : enrollments) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(enrollment.getStudent().getStudentCode());
                row.createCell(1).setCellValue(enrollment.getStudent().getUser().getFullName());
                
                Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElse(null);
                if (grade != null && grade.getMidtermScore() != null) {
                    row.createCell(2).setCellValue(grade.getMidtermScore());
                }
                if (grade != null && grade.getFinalScore() != null) {
                    row.createCell(3).setCellValue(grade.getFinalScore());
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel file: " + e.getMessage());
        }
    }

    @Transactional
    public void importGradesFromExcel(Long courseId, MultipartFile file) {
        Lecturer currentLecturer = getCurrentLecturer();
        verifyCourseOwnership(courseId, currentLecturer);

        GradeComponent gradeComponent = gradeComponentRepository.findByCourseId(courseId)
                .orElseThrow(() -> new RuntimeException("Grade component not found for this course"));
        Double midtermWeight = gradeComponent.getMidtermWeight();

        GradeSubmission midtermSub = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "MIDTERM").orElse(null);
        GradeSubmission finalSub = gradeSubmissionRepository.findByCourseIdAndGradeType(courseId, "FINAL").orElse(null);
        boolean midtermLocked = midtermSub != null && "SUBMITTED".equals(midtermSub.getStatus());
        boolean finalLocked = finalSub != null && "SUBMITTED".equals(finalSub.getStatus());

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (rows.hasNext()) {
                rows.next(); // Skip header
            }

            while (rows.hasNext()) {
                Row currentRow = rows.next();
                Cell cell0 = currentRow.getCell(0);
                if (cell0 == null) continue;
                
                String studentCode = "";
                if (cell0.getCellType() == CellType.STRING) {
                    studentCode = cell0.getStringCellValue().trim();
                } else if (cell0.getCellType() == CellType.NUMERIC) {
                    studentCode = String.valueOf((long) cell0.getNumericCellValue());
                }

                if (studentCode.isEmpty()) continue;

                final String finalStudentCode = studentCode;
                Enrollment enrollment = enrollments.stream()
                        .filter(e -> e.getStudent().getStudentCode().equalsIgnoreCase(finalStudentCode))
                        .findFirst()
                        .orElse(null);

                if (enrollment == null) continue;

                Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                        .orElseGet(() -> {
                            Grade newGrade = new Grade();
                            newGrade.setEnrollment(enrollment);
                            return newGrade;
                        });

                Cell midtermCell = currentRow.getCell(2);
                if (!midtermLocked && midtermCell != null && midtermCell.getCellType() == CellType.NUMERIC) {
                    double midtermScore = midtermCell.getNumericCellValue();
                    if (midtermScore >= 0 && midtermScore <= 10) {
                        grade.setMidtermScore(midtermScore);
                    }
                }

                Cell finalCell = currentRow.getCell(3);
                if (!finalLocked && finalCell != null && finalCell.getCellType() == CellType.NUMERIC) {
                    double finalScore = finalCell.getNumericCellValue();
                    if (finalScore >= 0 && finalScore <= 10) {
                        grade.setFinalScore(finalScore);
                    }
                }

                if (grade.getMidtermScore() != null && grade.getFinalScore() != null) {
                    double total = grade.getMidtermScore() * midtermWeight + grade.getFinalScore() * (1.0 - midtermWeight);
                    total = Math.round(total * 100.0) / 100.0;
                    grade.setTotalScore(total);
                }

                gradeRepository.save(grade);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
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
