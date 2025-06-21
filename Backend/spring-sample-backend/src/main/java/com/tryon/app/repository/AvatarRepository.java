package com.tryon.app.repository;

import com.tryon.app.model.Avatar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AvatarRepository extends JpaRepository<Avatar, Long> {
    Optional<Avatar> findByUserId(Long userId);
}
