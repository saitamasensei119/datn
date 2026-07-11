package com.datct.datn.modules.timetable.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class TimetableDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateCoursesRequest {
        private Long semesterId;
        private Integer defaultMaxStudents = 40;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleRequest {
        private Long semesterId;
        private Integer timeoutSeconds = 60;
        private Integer weightSc7ShiftContiguity = 3968;
        private Integer weightSc3GapReduction = 2312;
        private Integer weightSc1CoEnrollment = 1625;
        private Integer weightPreferredBuilding = 1023;
        private Integer weightSc2EarlyLate = 652;
        private Integer weightSc4CapacityOptimization = 419;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AhpWeightRequest {
        // Ma trận 6x6 hoặc 5x5 so sánh cặp Saaty
        private double[][] pairwiseMatrix;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AhpWeightResponse {
        private Integer weightSc7ShiftContiguity;
        private Integer weightSc3GapReduction;
        private Integer weightSc1CoEnrollment;
        private Integer weightPreferredBuilding;
        private Integer weightSc2EarlyLate;
        private Integer weightSc4CapacityOptimization;
        private Double consistencyRatio;
        private Boolean isValid;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimetableResponse {
        private String message;
        private Integer coursesGenerated;
        private Integer schedulesCreated;
        private Double penaltyScore;
        private Double executionTimeSeconds;

        public TimetableResponse(String message, Integer coursesGenerated, Integer schedulesCreated, Double penaltyScore) {
            this.message = message;
            this.coursesGenerated = coursesGenerated;
            this.schedulesCreated = schedulesCreated;
            this.penaltyScore = penaltyScore;
            this.executionTimeSeconds = 0.0;
        }
    }
}
