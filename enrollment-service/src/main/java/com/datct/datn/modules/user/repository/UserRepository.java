package com.datct.datn.modules.user.repository;


import com.datct.datn.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.failedLoginAttempts = 0, u.accountLockedUntil = null WHERE (u.accountLockedUntil IS NOT NULL AND u.accountLockedUntil < :now) OR (u.failedLoginAttempts > 0 AND u.accountLockedUntil IS NULL)")
    void resetStaleFailedLoginAttempts(@org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);
}