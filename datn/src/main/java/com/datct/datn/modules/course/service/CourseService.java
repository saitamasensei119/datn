package com.datct.datn.modules.course.service;

import com.datct.datn.modules.course.DTO.CourseResponse;
import com.datct.datn.modules.course.DTO.CreateCourseRequest;
import com.datct.datn.modules.course.DTO.UpdateCourseRequest;
import com.datct.datn.modules.course.entity.Course;
import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    private final SubjectRepository subjectRepository;

    private final LecturerRepository lecturerRepository;

    private final SemesterRepository semesterRepository;

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

        Course saved =
                courseRepository.save(course);

        return mapToResponse(saved);
    }

    public List<CourseResponse> getAll() {

        return courseRepository.findAll()
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

        Course updated =
                courseRepository.save(course);

        return mapToResponse(updated);
    }

    public void delete(Long id) {

        courseRepository.deleteById(id);
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
                course.getSemester().getName()
        );
    }
}