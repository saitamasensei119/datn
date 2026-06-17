package com.datct.datn.modules.schedule.service;

import com.datct.datn.modules.schedule.DTO.RoomRequest;
import com.datct.datn.modules.schedule.DTO.RoomResponse;
import com.datct.datn.modules.schedule.entity.Room;
import com.datct.datn.modules.schedule.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
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

        return RoomResponse.fromEntity(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy phòng học");
        }
        roomRepository.deleteById(id);
    }
}
