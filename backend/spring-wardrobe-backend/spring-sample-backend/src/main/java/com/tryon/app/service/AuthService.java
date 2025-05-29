package com.tryon.app.service;

import com.tryon.app.model.User;
import com.tryon.app.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.util.Date;

@Service
public class AuthService implements UserDetailsService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;

    @Value("${jwt.secret}")
    private String jwtSecret;
    @Value("${jwt.expiration-ms}")
    private long jwtExpiryMillis;

    @Autowired
    public AuthService(UserRepository userRepo,
                       PasswordEncoder passwordEncoder,
                       @Lazy AuthenticationManager authManager) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.authManager = authManager;
    }

    public String register(String email, String rawPassword) {
        if (userRepo.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRole("USER");
        userRepo.save(u);
        return generateToken(email);
    }

    public String login(String email, String rawPassword) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, rawPassword)
        );
        return generateToken(email);
    }

    private String generateToken(String email) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtExpiryMillis);
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return org.springframework.security.core.userdetails.User
                .withUsername(u.getEmail())
                .password(u.getPasswordHash())
                .roles(u.getRole())
                .build();
    }
}