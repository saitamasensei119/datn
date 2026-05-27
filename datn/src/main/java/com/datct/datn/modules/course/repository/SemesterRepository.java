package com.datct.datn.modules.course.repository;

import com.datct.datn.modules.course.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SemesterRepository
        extends JpaRepository<Semester, Long> {

}
