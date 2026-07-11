package com.datct.datn.modules.user.repository;

import com.datct.datn.modules.user.entity.PasswordResetToken;
import com.datct.datn.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    List<PasswordResetToken> findByUser(User user);

    void deleteByExpiryDateBefore(LocalDateTime now);
}
