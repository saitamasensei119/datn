package com.datct.datn.modules.lecturer.repository;

import com.datct.datn.modules.lecturer.entity.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LecturerRepository
        extends JpaRepository<Lecturer, Long> {

    boolean existsByLecturerCode(
            String lecturerCode
    );
}