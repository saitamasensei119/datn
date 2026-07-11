package com.datct.datn.modules.course.DTO;

import com.datct.datn.modules.course.entity.SemesterStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class SemesterResponse {

    private Long id;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    private SemesterStatus status;
}
