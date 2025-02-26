package com.company.taskmanager.controller;

import com.company.taskmanager.entity.User;
import com.company.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;
@RestController
@RequestMapping("/password")
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email tapılmadı"));

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        userRepository.save(user);

        sendEmail(user.getEmail(), resetToken);

        return ResponseEntity.ok("Email göndərildi!");
    }

    private void sendEmail(String email, String token) {
        String resetLink = "http://localhost:63342/taskmanager/static/reset-password.html?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Şifrəni sıfırlama");
        message.setText("Şifrənizi sıfırlamaq üçün bu linkə daxil olun: " + resetLink);
        mailSender.send(message);
    }
}
