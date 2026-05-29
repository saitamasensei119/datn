//package com.datct.datn.data;
//
//import com.datct.datn.modules.user.entity.Role;
//import com.datct.datn.modules.user.entity.User;
//import com.datct.datn.modules.user.repository.UserRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Component;
//
//@Component
//@RequiredArgsConstructor
//public class DataInitializer implements CommandLineRunner {
//
//    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;
//
//    @Override
//    public void run(String... args) {
//
//        if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
//
//            User admin = new User();
//            admin.setFullName("admintest");
//            admin.setEmail("admin@gmail.com");
//            admin.setPassword(passwordEncoder.encode("123456"));
//            admin.setRole(Role.ADMIN);
//
//            userRepository.save(admin);
//        }
//    }
//}