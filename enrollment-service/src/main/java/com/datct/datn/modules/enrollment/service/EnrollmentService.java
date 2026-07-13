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
import com.datct.datn.modules.course.entity.SemesterStatus;
import com.datct.datn.modules.enrollment.repository.PreRegistrationRepository;
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
    private final PreRegistrationRepository preRegistrationRepository;
    private final RedisSlotService redisSlotService;

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

        checkEnrollmentEligibilityAndConditions(student, course, request.isIgnoreWarning());

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

        checkEnrollmentEligibilityAndConditions(student, course, request.isIgnoreWarning());

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

        // Kiểm tra nhánh trạng thái học kỳ theo quy trình 2 giai đoạn (Wishlist-Driven 2-Phase Enrollment)
        checkEnrollmentEligibilityAndConditions(student, course, ignoreWarning);

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

    private void checkEnrollmentEligibilityAndConditions(Student student, Course course, boolean ignoreWarning) {
        SemesterStatus status = course.getSemester().getStatus();
        if (status == SemesterStatus.ENROLLMENT_PHASE_1) {
            // GIAI ĐOẠN 1: Đăng ký theo Nguyện vọng (Fast Path - Zero-Validation)
            // Không cần kiểm tra <= 25 tín chỉ hay môn tiên quyết vì đã được thẩm định khắt khe ở bước Đăng ký Nguyện Vọng
            boolean inWishlist = preRegistrationRepository.existsByStudentIdAndSubjectIdAndSemesterId(
                    student.getId(), course.getSubject().getId(), course.getSemester().getId()
            );
            if (!inWishlist) {
                throw new RuntimeException("Giai đoạn 1: Bạn chỉ được phép đăng ký các lớp học phần của Môn học đã đăng ký trong Nguyện vọng từ trước!");
            }
            // BỎ QUA HOÀN TOÀN validateSubjectConditions() -> Thẳng tiến kiểm tra trùng & sĩ số!
        } else {
            // GIAI ĐOẠN 2 (ENROLLMENT_OPEN hoặc mặc định): Đăng ký tự do / bổ sung -> Kiểm tra giới hạn 25 tín chỉ & Ràng buộc học thuật
            Integer currentCredits = enrollmentRepository.sumCreditsByStudentIdAndSemesterId(
                    student.getId(), course.getSemester().getId()
            );
            if (currentCredits + course.getSubject().getCredits() > 25) {
                throw new RuntimeException("Giai đoạn 2: Tổng số tín chỉ đăng ký vượt quá giới hạn cho phép (25 tín chỉ)!");
            }
            validateSubjectConditions(student, course, ignoreWarning);
        }
    }

    private void validateSubjectConditions(Student student, Course course, boolean ignoreWarning) {
        List<SubjectCondition> conditions = subjectConditionRepository.findBySubjectId(course.getSubject().getId());
        if (conditions.isEmpty()) {
            return;
        }

        // TỐI ƯU 1: Gộp toàn bộ truy vấn kiểm tra điểm môn tiên quyết/môn trước vào 1 câu SQL IN (Batch Query)
        java.util.Set<Long> requiredSubjectIds = conditions.stream()
                .map(c -> c.getRequiredSubject().getId())
                .collect(java.util.stream.Collectors.toSet());

        java.util.Map<Long, StudentSubjectResult> resultMap = studentSubjectResultRepository
                .findByStudentIdAndSubjectIdIn(student.getId(), requiredSubjectIds).stream()
                .collect(java.util.stream.Collectors.toMap(r -> r.getSubject().getId(), r -> r, (r1, r2) -> r1));

        for (SubjectCondition condition : conditions) {
            StudentSubjectResult result = resultMap.get(condition.getRequiredSubject().getId());

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
                        // TỐI ƯU 2: Sử dụng SQL EXISTS trên Index thay vì kéo toàn bộ danh sách Enrollment lên RAM rồi lọc bằng Java Stream
                        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndSubjectIdAndSemesterId(
                                student.getId(), condition.getRequiredSubject().getId(), course.getSemester().getId()
                        );
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
        redisSlotService.releaseSlot(courseId);
    }

    @Transactional
    public void unenrollByAdmin(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        // No status check for admin
        enrollmentRepository.delete(enrollment);
        redisSlotService.releaseSlot(courseId);
    }

    public Long getCurrentStudentId() {
        Long userId = SecurityUtil.getCurrentUserId();
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return student.getId();
    }
}
