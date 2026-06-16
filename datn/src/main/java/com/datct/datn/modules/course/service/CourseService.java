package com.datct.datn.modules.course.service;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.DTO.CreateCourseRequest;
import com.datct.datn.modules.course.DTO.StudentCourseResponse;
import com.datct.datn.modules.course.DTO.UpdateCourseRequest;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.CourseStatus;
import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.grade.entity.GradeSubmission;
import com.datct.datn.modules.grade.repository.GradeSubmissionRepository;
import com.datct.datn.modules.enrollment.repository.EnrollmentRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.DTO.StudentResponse;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    private final SubjectRepository subjectRepository;

    private final LecturerRepository lecturerRepository;

    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeSubmissionRepository gradeSubmissionRepository;

    public CourseResponse create(
            CreateCourseRequest request
    ) {

        boolean exists =
                courseRepository.existsByCourseCode(
                        request.getCourseCode()
                );

        if (exists) {
            throw new RuntimeException(
                    "Course code already exists"
            );
        }

        Subject subject =
                subjectRepository.findById(
                        request.getSubjectId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Subject not found"
                        )
                );

        Semester semester =
                semesterRepository.findById(
                        request.getSemesterId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Semester not found"
                        )
                );

        Lecturer lecturer = null;

        if (request.getLecturerId() != null) {

            lecturer =
                    lecturerRepository.findById(
                            request.getLecturerId()
                    ).orElseThrow(
                            () -> new RuntimeException(
                                    "Lecturer not found"
                            )
                    );
        }

        Course course = new Course();

        course.setCourseCode(
                request.getCourseCode()
        );

        course.setMaxStudents(
                request.getMaxStudents()
        );

        course.setSubject(subject);

        course.setSemester(semester);

        course.setLecturer(lecturer);

        course.setWeekPattern(request.getWeekPattern());

        course.setOpeningBatch(request.getOpeningBatch());

        com.datct.datn.modules.grade.entity.GradeComponent gradeComponent = new com.datct.datn.modules.grade.entity.GradeComponent();
        gradeComponent.setCourse(course);
        gradeComponent.setMidtermWeight(request.getMidtermWeight());
        course.setGradeComponent(gradeComponent);

        Course saved =
                courseRepository.save(course);

        GradeSubmission midtermSubmission = GradeSubmission.builder()
                .course(saved)
                .gradeType("MIDTERM")
                .status("NOT_SUBMITTED")
                .build();
                
        GradeSubmission finalSubmission = GradeSubmission.builder()
                .course(saved)
                .gradeType("FINAL")
                .status("NOT_SUBMITTED")
                .build();
                
        gradeSubmissionRepository.save(midtermSubmission);
        gradeSubmissionRepository.save(finalSubmission);

        return mapToResponse(saved);
    }

    public List<CourseResponse> getAll() {

        return courseRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<CourseResponse> searchAdminCourses(String courseCode) {
        if (courseCode == null || courseCode.trim().isEmpty()) {
            return getAll();
        }
        return courseRepository.findByCourseCodeContainingIgnoreCase(courseCode)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CourseResponse getById(Long id) {

        Course course =
                courseRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Course not found"
                                )
                        );

        return mapToResponse(course);
    }

    public CourseResponse update(
            Long id,
            UpdateCourseRequest request
    ) {

        Course course =
                courseRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Course not found"
                                )
                        );

        Subject subject =
                subjectRepository.findById(
                        request.getSubjectId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Subject not found"
                        )
                );

        Semester semester =
                semesterRepository.findById(
                        request.getSemesterId()
                ).orElseThrow(
                        () -> new RuntimeException(
                                "Semester not found"
                        )
                );

        Lecturer lecturer = null;

        if (request.getLecturerId() != null) {

            lecturer =
                    lecturerRepository.findById(
                            request.getLecturerId()
                    ).orElseThrow(
                            () -> new RuntimeException(
                                    "Lecturer not found"
                            )
                    );
        }

        course.setCourseCode(
                request.getCourseCode()
        );

        course.setMaxStudents(
                request.getMaxStudents()
        );

        course.setSubject(subject);

        course.setSemester(semester);

        course.setLecturer(lecturer);
        course.setStatus(
                request.getStatus()
        );
        course.setWeekPattern(request.getWeekPattern());
        course.setOpeningBatch(request.getOpeningBatch());

        if (course.getGradeComponent() != null) {
            course.getGradeComponent().setMidtermWeight(request.getMidtermWeight());
        } else {
            com.datct.datn.modules.grade.entity.GradeComponent gc = new com.datct.datn.modules.grade.entity.GradeComponent();
            gc.setCourse(course);
            gc.setMidtermWeight(request.getMidtermWeight());
            course.setGradeComponent(gc);
        }

        Course updated =
                courseRepository.save(course);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        courseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesOfLecturer() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();

        Long userId =
                userDetails.getUser().getId();
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        return courseRepository
                .findByLecturerId(lecturer.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Page<CourseResponse> getOpenCourses(
            Pageable pageable
    ) {

        return courseRepository
                .findByStatus(
                        CourseStatus.OPEN,
                        pageable
                )
                .map(this::mapToResponse);
    }

    public Page<CourseResponse> searchOpenCoursesByCourseCode(
            String courseCode,
            Pageable pageable
    ) {
        return courseRepository
                .findByStatusAndCourseCodeContainingIgnoreCase(
                        CourseStatus.OPEN,
                        courseCode,
                        pageable
                )
                .map(this::mapToResponse);
    }

    public Page<CourseResponse> searchOpenCoursesBySubjectCode(
            String subjectCode,
            Pageable pageable
    ) {
        return courseRepository
                .findByStatusAndSubject_SubjectCodeContainingIgnoreCase(
                        CourseStatus.OPEN,
                        subjectCode,
                        pageable
                )
                .map(this::mapToResponse);
    }

    public Page<CourseResponse> searchOpenCoursesBySubjectName(
            String name,
            Pageable pageable
    ) {
        return courseRepository
                .findByStatusAndSubject_NameContainingIgnoreCase(
                        CourseStatus.OPEN,
                        name,
                        pageable
                )
                .map(this::mapToResponse);
    }

    public List<StudentResponse> getStudentsByCourseId(
            Long courseId
    ) {

        List<Student> students =
                enrollmentRepository
                        .findStudentsByCourseId(courseId);

        return students.stream()
                .map(student ->
                        new StudentResponse(
                                student.getId(),
                                student.getUser().getFullName(),
                                student.getUser().getEmail(),
                                student.getStudentCode(),
                                student.getDepartment() != null
                                        ? student.getDepartment().getId()
                                        : null,
                                student.getDepartment() != null ? student.getDepartment().getName() : null,
                                student.getStatus()
                        )
                )
                .toList();
    }

    public List<StudentResponse> searchStudentsByCourseIdAndStudentCode(Long courseId, String studentCode) {
        if (studentCode == null || studentCode.trim().isEmpty()) {
            return getStudentsByCourseId(courseId);
        }
        
        List<Student> students = enrollmentRepository.searchStudentsByCourseIdAndStudentCode(courseId, studentCode);
        
        return students.stream()
                .map(student ->
                        new StudentResponse(
                                student.getId(),
                                student.getUser().getFullName(),
                                student.getUser().getEmail(),
                                student.getStudentCode(),
                                student.getDepartment() != null
                                        ? student.getDepartment().getId()
                                        : null,
                                student.getDepartment() != null ? student.getDepartment().getName() : null,
                                student.getStatus()
                        )
                )
                .toList();
    }



    private CourseResponse mapToResponse(
            Course course
    ) {

        return new CourseResponse(
                course.getId(),
                course.getCourseCode(),
                course.getMaxStudents(),
                course.getSubject().getName(),
                course.getLecturer() != null
                        ? course.getLecturer()
                        .getUser()
                        .getFullName()
                        : null,
                course.getSemester().getName(),
                course.getStatus(),
                course.getSubject().getId(),
                course.getLecturer() != null ? course.getLecturer().getId() : null,
                course.getSemester().getId(),
                course.getWeekPattern(),
                course.getOpeningBatch(),
                course.getGradeComponent() != null ? course.getGradeComponent().getMidtermWeight() : null
        );
    }
}