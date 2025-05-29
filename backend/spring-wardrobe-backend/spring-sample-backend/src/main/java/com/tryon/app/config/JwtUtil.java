package com.tryon.app.config;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String jwtSecret;

    public Jws<Claims> validateToken(String token) {
        return Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
    }

    public String getUsername(String token) {
        return validateToken(token).getBody().getSubject();
    }
}