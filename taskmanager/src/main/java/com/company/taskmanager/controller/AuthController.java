package com.company.taskmanager.controller;

import com.company.taskmanager.requestandresponse.AuthRequest;
import com.company.taskmanager.entity.User;
import com.company.taskmanager.repository.UserRepository;
import com.company.taskmanager.requestandresponse.PasswordUpdateRequest;
import com.company.taskmanager.service.CustomUserDetailsService;
import com.company.taskmanager.service.EmailService;
import com.company.taskmanager.utility.JwtUtil;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                          UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService, CustomUserDetailsService customUserDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        // İstifadəçi artıq mövcuddursa, xətanı qaytar

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        if (request.getEmail() == null || request.getEmail().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(false);  // Email təsdiqlənməyibsə, aktiv deyil

        userRepository.save(user);

        
        String encodedEmail = URLEncoder.encode(request.getEmail(), StandardCharsets.UTF_8);
        String confirmLink = "http://localhost:9090/taskmanager/auth/confirm?email=" + encodedEmail;
        String emailBody = "Zəhmət olmasa, emailinizi təsdiqləmək üçün bu linkə daxil olun: <a href=\"" + confirmLink + "\">Təsdiqlə</a>";

        try {
            emailService.sendEmail(request.getEmail(), "Qeydiyyat təsdiqi", emailBody);
            return ResponseEntity.ok("Email təsdiqləmə linki göndərildi!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Email göndərmə xətası: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        System.out.println("Received email: " + request.getEmail());

        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(authentication.getName());

    
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEnabled()) { // Email aktiv deyilsə login icazə vermirik
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email not verified");
        }

        String token = jwtUtil.generateToken(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername()); // İstifadəçi adını da qaytarırıq

        return ResponseEntity.ok(response);
    }



    @GetMapping("/confirm")
    public ResponseEntity<?> confirmEmail(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();
        if (user.isEnabled()) {
            return ResponseEntity.ok("Email artıq təsdiqlənib.");
        }

        user.setEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok("Email verified successfully. You can now log in.");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        String jwtToken = token.replace("Bearer ", ""); // "Bearer " hissəsini sil
        jwtUtil.invalidateToken(jwtToken);
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        jwtUtil.invalidateToken(token);
        return ResponseEntity.ok("Çıxış edildi, token bloklandı.");
    }


    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@AuthenticationPrincipal UserDetails userDetails,
                                            @RequestBody PasswordUpdateRequest request) {
        System.out.println("Authenticated user: " + userDetails.getUsername());

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found!"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully!");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        User user = (User) userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Token tapılmadı"));

        user.setPassword(new BCryptPasswordEncoder().encode(newPassword));
        user.setResetToken(null);
        user.setFailedAttempts(0);
        user.setLocked(false);
        userRepository.save(user);

        return ResponseEntity.ok("Şifrə yeniləndi!");
    }


}
