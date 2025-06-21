package com.tryon.app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "avatars")
public class Avatar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long avatarId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 512)
    private String selfieUrl;

    @Lob
    private String keypoints;

    // getters & setters
}
