package com.datct.datn.auth.filter;

import com.datct.datn.auth.CustomUserDetails;
import com.datct.datn.modules.enrollment.service.RedisSlotService;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class EnrollmentRateLimitFilter extends OncePerRequestFilter {

    private final RedisSlotService redisSlotService;
    private final StudentRepository studentRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Chỉ kiểm tra khi gọi API đăng ký học phần (POST /api/student/enrollments hoặc /api/admin/enrollments/async)
        String requestURI = request.getRequestURI();
        boolean isEnrollmentPost = (requestURI.equals("/api/student/enrollments") || requestURI.equals("/api/admin/enrollments/async"))
                && "POST".equalsIgnoreCase(request.getMethod());

        if (!isEnrollmentPost) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            Long userId = userDetails.getUser().getId();

            Student student = studentRepository.findByUserId(userId).orElse(null);
            if (student != null) {
                // Kiểm tra Lính gác Trừng phạt Tầng 3 (Spam Penalty Ban Check)
                if (redisSlotService.isBlocked(student.getId())) {
                    log.warn("BLOCKED SPAMMER AT EDGE FILTER: Student {} attempted to register while serving a 5-minute penalty ban!", student.getId());
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"Spam Blocked\", \"message\": \"Tài khoản của bạn đang bị KHÓA TẠM THỜI trong 5 phút do hệ thống phát hiện hành vi sử dụng Tool/Bot spam request gây lãng phí tài nguyên!\"}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
