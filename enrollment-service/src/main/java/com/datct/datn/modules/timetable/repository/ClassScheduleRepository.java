package com.datct.datn.modules.timetable.repository;

import com.datct.datn.modules.timetable.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {

    List<ClassSchedule> findByCourseId(Long courseId);

    List<ClassSchedule> findByCourse_Semester_Id(Long semesterId);
}
