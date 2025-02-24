package com.company.taskmanager.repository;

import com.company.taskmanager.entity.RefreshToken;
import com.company.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}
