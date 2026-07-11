package com.datct.datn.modules.schedule.repository;

import com.datct.datn.modules.schedule.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomName(String roomName);
    java.util.Optional<Room> findByRoomName(String roomName);
}
