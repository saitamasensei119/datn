package com.datct.datn.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Hệ Thống Quản Lý Đào Tạo University Management REST API",
                version = "1.0.0",
                description = "Tài liệu API cho các phân hệ Quản trị (Admin), Giảng viên (Teacher) và Sinh viên (Student)",
                contact = @Contact(
                        name = "DATCT DATN Team",
                        email = "datct@edu.vn"
                )
        ),
        security = {
                @SecurityRequirement(name = "bearerAuth")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "Nhập JWT Bearer Token để xác thực (Không cần gõ từ khóa Bearer phía trước, chỉ dán chuỗi token)",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
