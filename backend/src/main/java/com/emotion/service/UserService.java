package com.emotion.service;

import com.emotion.dto.AuthResponse;
import com.emotion.dto.ProfileUpdateRequest;
import com.emotion.dto.LoginRequest;
import com.emotion.entity.User;
import com.emotion.repository.UserRepository;
import com.emotion.security.CustomUserDetailsService;
import com.emotion.security.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final CustomUserDetailsService userDetailsService;

    public AuthResponse login(LoginRequest request) {
        User user = userDetailsService.getUserEntity(request.getUsername());

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        if (user.getStatus() == User.UserStatus.DISABLED) {
            throw new RuntimeException("账户已被禁用");
        }

        String token = jwtTokenUtil.generateToken(user.getUsername(), user.getRole().name());

        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    public User getCurrentUser(String username) {
        return userDetailsService.getUserEntity(username);
    }

    @Transactional
    public User updateProfile(String username, ProfileUpdateRequest request) {
        User user = getCurrentUser(username);
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = getCurrentUser(username);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(String username) {
        // 禁止删除 admin 账户
        if ("admin".equals(username)) {
            throw new RuntimeException("Cannot delete admin account");
        }
        User user = getCurrentUser(username);
        userRepository.delete(user);
    }
}
