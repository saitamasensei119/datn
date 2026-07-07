package com.datct.datn.modules.user.service;

import com.datct.datn.modules.course.repository.CourseRepository;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.entity.StudentStatus;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.user.DTO.AdminDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getOverviewStats() {
        long activeStudents = 0;
        long suspendedStudents = 0;

        for (Object[] row : studentRepository.countGroupByStatus()) {
            StudentStatus status = (StudentStatus) row[0];
            Long count = (Long) row[1];

            if (status == StudentStatus.ACTIVE) {
                activeStudents = count;
            } else if (status == StudentStatus.SUSPENDED) {
                suspendedStudents = count;
            }
        }

        long totalTeachers = lecturerRepository.count();
        long totalCourses = courseRepository.count();

        return new AdminDashboardStatsResponse(activeStudents, suspendedStudents, totalTeachers, totalCourses);
    }
}
