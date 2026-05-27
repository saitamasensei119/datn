package com.datct.datn.modules.course.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateSemesterRequest {

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;
}
