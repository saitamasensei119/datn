package com.datct.datn.modules.schedule.service;

import com.datct.datn.modules.schedule.DTO.RoomRequest;
import com.datct.datn.modules.schedule.DTO.RoomResponse;
import com.datct.datn.modules.schedule.entity.Room;
import com.datct.datn.modules.schedule.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {
    private final RoomRepository roomRepository;

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(RoomResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<RoomResponse> getRooms(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("id").ascending());
        return roomRepository.findAll(pageable)
                .map(RoomResponse::fromEntity);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepository.existsByRoomName(request.getRoomName())) {
            throw new RuntimeException("Tên phòng học đã tồn tại");
        }

        Room room = new Room();
        room.setRoomName(request.getRoomName());
        room.setCapacity(request.getCapacity());
        room.setBuilding(request.getBuilding());

        return RoomResponse.fromEntity(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng học"));

        if (!room.getRoomName().equals(request.getRoomName()) && 
            roomRepository.existsByRoomName(request.getRoomName())) {
            throw new RuntimeException("Tên phòng học đã tồn tại");
        }

        room.setRoomName(request.getRoomName());
        room.setCapacity(request.getCapacity());
        room.setBuilding(request.getBuilding());

        return RoomResponse.fromEntity(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy phòng học");
        }
        roomRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        int created = 0;
        int skipped = 0;
        int errors = 0;

        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        long totalDbSaveTime = 0;
        long memoryUsedMB = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
            memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String roomName = getCellString(row.getCell(2)); // Cột số 3 (Index 2 - Phòng)
                    if (roomName == null || roomName.isEmpty()) {
                        continue;
                    }

                    // Kiểm tra trùng lặp: Nếu phòng đã tồn tại -> báo lỗi trùng lặp
                    if (roomRepository.existsByRoomName(roomName)) {
                        errors++;
                        log.warn("Dòng {}: Lỗi trùng lặp - Phòng học '{}' đã tồn tại trong hệ thống.", i, roomName);
                        continue;
                    }

                    String building = getCellString(row.getCell(1)); // Cột số 2 (Index 1 - Nhà)
                    Integer capacity = getCellInt(row.getCell(4));    // Cột số 5 (Index 4 - Sức chứa)

                    Room room = new Room();
                    room.setRoomName(roomName);
                    room.setBuilding(building);
                    room.setCapacity(capacity > 0 ? capacity : 50);

                    long dbSaveStartTime = System.currentTimeMillis();
                    roomRepository.save(room);
                    totalDbSaveTime += (System.currentTimeMillis() - dbSaveStartTime);
                    created++;
                } catch (Exception e) {
                    log.error("Lỗi dòng {}: {}", i, e.getMessage());
                    errors++;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi đọc file Excel phòng học", e);
            throw new RuntimeException("Không thể đọc file Excel: " + e.getMessage());
        }

        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        long parseTime = executionTime - totalDbSaveTime;

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

    private Integer getCellInt(Cell cell) {
        if (cell == null) return 0;
        switch (cell.getCellType()) {
            case NUMERIC:
                return (int) cell.getNumericCellValue();
            case STRING:
                try {
                    return Integer.parseInt(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    return 0;
                }
            default:
                return 0;
        }
    }
}
