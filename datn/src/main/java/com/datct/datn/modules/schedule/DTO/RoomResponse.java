package com.datct.datn.modules.schedule.DTO;

import com.datct.datn.modules.schedule.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String roomName;
    private Integer capacity;

    public static RoomResponse fromEntity(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getRoomName(),
                room.getCapacity()
        );
    }
}
