package com.datct.datn.modules.timetable.service;

import com.datct.datn.modules.timetable.DTO.TimetableDTOs.AhpWeightRequest;
import com.datct.datn.modules.timetable.DTO.TimetableDTOs.AhpWeightResponse;
import org.springframework.stereotype.Service;

@Service
public class AhpWeightService {

    private static final double[] RI_VALUES = {0.0, 0.0, 0.0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45};
    private static final int SCALE_FACTOR = 10000;

    public AhpWeightResponse calculateWeights(AhpWeightRequest request) {
        double[][] matrix = (request != null && request.getPairwiseMatrix() != null && request.getPairwiseMatrix().length == 6)
                ? request.getPairwiseMatrix()
                : getDefaultPairwiseMatrix();

        int n = matrix.length;
        double[] geoMeans = new double[n];
        double sumGeoMeans = 0.0;

        for (int i = 0; i < n; i++) {
            double product = 1.0;
            for (int j = 0; j < n; j++) {
                product *= matrix[i][j];
            }
            geoMeans[i] = Math.pow(product, 1.0 / n);
            sumGeoMeans += geoMeans[i];
        }

        double[] weights = new double[n];
        for (int i = 0; i < n; i++) {
            weights[i] = geoMeans[i] / sumGeoMeans;
        }

        // Tính Consistency Ratio (CR)
        double[] aw = new double[n];
        double lambdaMax = 0.0;
        for (int i = 0; i < n; i++) {
            double sum = 0.0;
            for (int j = 0; j < n; j++) {
                sum += matrix[i][j] * weights[j];
            }
            aw[i] = sum;
            lambdaMax += aw[i] / weights[i];
        }
        lambdaMax /= n;

        double ci = (lambdaMax - n) / (n - 1);
        double ri = (n < RI_VALUES.length) ? RI_VALUES[n] : 1.49;
        double cr = (ri > 0) ? ci / ri : 0.0;

        AhpWeightResponse response = new AhpWeightResponse();
        response.setWeightSc7ShiftContiguity((int) Math.round(weights[0] * SCALE_FACTOR));
        response.setWeightSc3GapReduction((int) Math.round(weights[1] * SCALE_FACTOR));
        response.setWeightSc1CoEnrollment((int) Math.round(weights[2] * SCALE_FACTOR));
        response.setWeightPreferredBuilding((int) Math.round(weights[3] * SCALE_FACTOR));
        response.setWeightSc2EarlyLate((int) Math.round(weights[4] * SCALE_FACTOR));
        response.setWeightSc4CapacityOptimization((int) Math.round(weights[5] * SCALE_FACTOR));
        response.setConsistencyRatio(Math.round(cr * 10000.0) / 10000.0);
        response.setIsValid(cr <= 0.10);

        return response;
    }

    private double[][] getDefaultPairwiseMatrix() {
        return new double[][] {
            {1.0,   2.0,   3.0,   4.0,   5.0,   7.0},   // SC7: Ca học chuẩn liên tục
            {0.5,   1.0,   2.0,   3.0,   4.0,   5.0},   // SC3: Tránh khoảng trống Gap
            {0.333, 0.5,   1.0,   2.0,   3.0,   4.0},   // SC1: Môn đăng ký cùng học gần nhau
            {0.25,  0.333, 0.5,   1.0,   2.0,   3.0},   // SC-Building: Tòa nhà ưu tiên
            {0.2,   0.25,  0.333, 0.5,   1.0,   2.0},   // SC2: Hạn chế tiết 1 sáng / muộn tối
            {0.143, 0.2,   0.25,  0.333, 0.5,   1.0}    // SC4: Tối ưu lãng phí ghế ngồi
        };
    }
}
