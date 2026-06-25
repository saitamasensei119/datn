package com.datct.datn.modules.subject.service;

import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubjectImportService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;

    private static final Map<String, Long> DEPARTMENT_MAP = new HashMap<>();

    static {
        DEPARTMENT_MAP.put("BGDTC", 6L);
        DEPARTMENT_MAP.put("KGDQP", 7L);
        DEPARTMENT_MAP.put("KKTVQL", 8L);
        DEPARTMENT_MAP.put("KML", 9L);
        DEPARTMENT_MAP.put("KNN", 5L);
        DEPARTMENT_MAP.put("KSPKT", 10L);
        DEPARTMENT_MAP.put("KTTD", 11L);
        DEPARTMENT_MAP.put("TCK", 12L);
        DEPARTMENT_MAP.put("TCNTT", 1L);
        DEPARTMENT_MAP.put("TDDT", 13L);
        DEPARTMENT_MAP.put("THKHSS", 3L);
        DEPARTMENT_MAP.put("TTNNHT", 4L);
        DEPARTMENT_MAP.put("TVL", 14L);
        DEPARTMENT_MAP.put("VVLKT", 15L);
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        int created = 0;
        int skipped = 0;
        int errors = 0;

        Runtime runtime = Runtime.getRuntime();
        runtime.gc(); // Yêu cầu dọn rác để kết quả đo chính xác hơn
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        long totalDbSaveTime = 0;
        long memoryUsedMB = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
            memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);
            log.info("==== THÔNG SỐ RAM ====");
            log.info("RAM tiêu thụ để bung file Excel: {} MB", memoryUsedMB);
            Sheet sheet = workbook.getSheetAt(0);

            Map<Long, Department> departmentCache = new HashMap<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String subjectCode = getCellString(row.getCell(4));
                    if (subjectCode == null || subjectCode.isEmpty()) {
                        continue; // Skip empty rows
                    }

                    // 1. Check duplicate
                    if (subjectRepository.existsBySubjectCode(subjectCode)) {
                        skipped++;
                        continue;
                    }

                    // 2. Map Department
                    String departmentCode = getCellString(row.getCell(1));
                    Long departmentId = DEPARTMENT_MAP.get(departmentCode.toUpperCase());
                    
                    if (departmentId == null) {
                        throw new RuntimeException("Không tìm thấy map cho Trường/Viện/Khoa: " + departmentCode);
                    }

                    Department department = departmentCache.computeIfAbsent(departmentId, id -> 
                        departmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Department ID: " + id))
                    );

                    // 3. Create Subject
                    Subject subject = new Subject();
                    subject.setSubjectCode(subjectCode);
                    subject.setName(getCellString(row.getCell(5)));
                    subject.setEnglishName(getCellString(row.getCell(6)));

                    // Extract credits (e.g., "3(2-1-0)" -> 3)
                    String creditStr = getCellString(row.getCell(7));
                    if (creditStr != null && !creditStr.isEmpty()) {
                        String rawCredit = creditStr.split("\\(")[0].trim();
                        subject.setCredits(Integer.parseInt(rawCredit));
                    } else {
                        subject.setCredits(0);
                    }

                    subject.setLabRequirement(getCellString(row.getCell(17)));
                    subject.setSubjectType(getCellString(row.getCell(21)));

                    String mgmtCode = getCellString(row.getCell(23));
                    if ("CT CHUẨN".equalsIgnoreCase(mgmtCode.trim())) {
                        mgmtCode = "CT_CHUAN";
                    }
                    subject.setManagementCode(mgmtCode);

                    // Note is ignored based on user request
                    subject.setNote(null);
                    
                    subject.setDepartment(department);

                    long dbSaveStartTime = System.currentTimeMillis();
                    subjectRepository.save(subject);
                    totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime);
                    created++;

                } catch (Exception e) {
                    log.error("Lỗi dòng {}: {}", i, e.getMessage());
                    errors++;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi đọc file Excel", e);
            throw new RuntimeException("Không thể đọc file Excel: " + e.getMessage());
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        long parseTime = executionTime - totalDbSaveTime;

        log.info("==== KẾT QUẢ ĐO LƯỜNG IMPORT EXCEL ====");
        log.info("Tổng thời gian: {} ms", executionTime);
        log.info("- Thời gian Đọc/Xử lý dữ liệu (Parse): {} ms", parseTime);
        log.info("- Thời gian Lưu vào DB (Single Insert): {} ms", totalDbSaveTime);
        log.info("Số dòng xử lý thành công: {}", created);

        Map<String, Object> response = new HashMap<>();
        response.put("created", created);
        response.put("skipped", skipped);
        response.put("errors", errors);
        response.put("timeTakenMs", executionTime);
        response.put("parseTimeMs", parseTime);
        response.put("dbSaveTimeMs", totalDbSaveTime);
        response.put("memoryUsedMB", memoryUsedMB);
        return response;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            default:
                return "";
        }
    }
}
