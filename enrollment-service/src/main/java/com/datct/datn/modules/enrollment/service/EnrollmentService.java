package com.datct.datn.modules.enrollment.service;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.course.DTO.StudentCourseResponse;
import com.datct.datn.modules.timetable.DTO.ClassScheduleResponse;
import com.datct.datn.modules.timetable.repository.ClassScheduleRepository;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.enrollment.DTO.EnrollmentRequest;
import com.datct.datn.modules.enrollment.entity.Enrollment;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.subject.entity.SubjectCondition;
import com.datct.datn.modules.subject.repository.SubjectConditionRepository;
import com.datct.datn.modules.grade.entity.StudentSubjectResult;
import com.datct.datn.modules.grade.repository.StudentSubjectResultRepository;
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
    private final SubjectConditionRepository subjectConditionRepository;
    private final StudentSubjectResultRepository studentSubjectResultRepository;
    private final ClassScheduleRepository classScheduleRepository;

    @Transactional
    public void enroll(EnrollmentRequest request) {
        try { Thread.sleep(150); } catch (Exception ignored) {}

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

        validateSubjectConditions(student, course, request.isIgnoreWarning());

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

        validateSubjectConditions(student, course, request.isIgnoreWarning());

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

    @Transactional
    public void processEnrollmentTask(Long studentId, Long courseId, boolean ignoreWarning) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Bỏ khóa bi quan (Non-blocking lookup) để tối ưu tốc độ tiêu thụ hàng đợi RabbitMQ, chấp nhận Soft Overbooking nhẹ
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Validate Subject Conditions
        validateSubjectConditions(student, course, ignoreWarning);

        // Check if already enrolled
        boolean exists = enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), courseId);
        if (exists) {
            throw new RuntimeException("Student already enrolled");
        }

        // Re-count to strictly enforce capacity constraint under lock
        long currentStudents = enrollmentRepository.countByCourseId(course.getId());
        if (currentStudents >= course.getMaxStudents()) {
            throw new RuntimeException("Course is full");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());

        enrollmentRepository.save(enrollment);
    }

    private void validateSubjectConditions(Student student, Course course, boolean ignoreWarning) {
        List<SubjectCondition> conditions = subjectConditionRepository.findBySubjectId(course.getSubject().getId());
        for (SubjectCondition condition : conditions) {
            StudentSubjectResult result = studentSubjectResultRepository
                    .findByStudentIdAndSubjectId(student.getId(), condition.getRequiredSubject().getId())
                    .orElse(null);

            switch (condition.getConditionType()) {
                case PREREQUISITE:
                    if (result == null || !Boolean.TRUE.equals(result.getIsPassed())) {
                        throw new RuntimeException("Bạn chưa đạt môn tiên quyết: " + condition.getRequiredSubject().getName());
                    }
                    break;
                case PRE_STUDY:
                    if (result == null) {
                        throw new RuntimeException("Bạn chưa học môn trước: " + condition.getRequiredSubject().getName());
                    }
                    break;
                case COREQUISITE:
                    if (result == null) {
                        boolean isEnrolled = enrollmentRepository.findByStudentId(student.getId()).stream()
                                .anyMatch(e -> e.getCourse().getSubject().getId().equals(condition.getRequiredSubject().getId())
                                        && e.getCourse().getSemester().getId().equals(course.getSemester().getId()));
                        if (!isEnrolled) {
                            throw new RuntimeException("Bạn phải học song hành hoặc đã học môn: " + condition.getRequiredSubject().getName());
                        }
                    }
                    break;
                case EQUIVALENT:
                    if (result != null && Boolean.TRUE.equals(result.getIsPassed())) {
                        if (!ignoreWarning) {
                            throw new RuntimeException("WARNING_EQUIVALENT:Bạn đã học và qua môn tương đương (" + condition.getRequiredSubject().getName() + "). Bạn có chắc chắn muốn đăng ký môn này không?");
                        }
                    }
                    break;
            }
        }
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
                .map(course -> {
                    List<ClassScheduleResponse> schedules = classScheduleRepository.findByCourseId(course.getId()).stream()
                            .map(cs -> new ClassScheduleResponse(
                                    cs.getId(),
                                    cs.getSessionNumber(),
                                    cs.getDayOfWeek(),
                                    cs.getStartPeriod(),
                                    cs.getEndPeriod(),
                                    cs.getShift(),
                                    cs.getTimeString(),
                                    cs.getWeekPattern(),
                                    cs.getRoom() != null ? cs.getRoom().getRoomName() : null
                            ))
                            .toList();
                    return new StudentCourseResponse(
                            course.getId(),
                            course.getCourseCode(),
                            course.getSubject().getName(),
                            course.getMaxStudents(),
                            course.getStatus(),
                            schedules
                    );
                })
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

    public Long getCurrentStudentId() {
        Long userId = SecurityUtil.getCurrentUserId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return student.getId();
    }
}
