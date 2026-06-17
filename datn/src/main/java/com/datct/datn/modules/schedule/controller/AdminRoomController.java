package com.datct.datn.modules.schedule.controller;

import com.datct.datn.modules.schedule.DTO.RoomRequest;
import com.datct.datn.modules.schedule.DTO.RoomResponse;
import com.datct.datn.modules.schedule.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
public class AdminRoomController {
    private final RoomService roomService;

    @GetMapping
    public List<RoomResponse> getAllRooms() {
        return roomService.getAllRooms();
    }

    @PostMapping
    public RoomResponse createRoom(@RequestBody RoomRequest request) {
        return roomService.createRoom(request);
    }

    @PutMapping("/{id}")
    public RoomResponse updateRoom(@PathVariable Long id, @RequestBody RoomRequest request) {
        return roomService.updateRoom(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
    }
}
