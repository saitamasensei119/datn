package com.datct.datn.modules.course.entity;

public enum SemesterStatus {
    PRE_REGISTRATION_OPEN,
    SCHEDULING,
    ENROLLMENT_PHASE_1, // Giai đoạn 1 cao điểm: Đăng ký theo nguyện vọng (Fast Path)
    ENROLLMENT_OPEN,    // Giai đoạn 2 tự do: Đăng ký bổ sung tự do (Full Validation)
    CLOSED
}
