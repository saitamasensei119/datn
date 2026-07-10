# Stage 1: Build từ mã nguồn sử dụng Maven + JDK 21 Linux
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Tải trước các dependency Maven (Được cache bởi Docker Layer nếu pom.xml không đổi)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ source code vào container và dịch ứng dụng (bỏ qua chạy test để nhanh)
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Môi trường chạy chính thức (Siêu nhẹ với eclipse-temurin JDK 21 Linux)
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copy file jar đã được dịch ở Stage 1
COPY --from=build /app/target/*.jar app.jar

# Mở cổng 8080 cho Spring Boot
EXPOSE 8080

# Khởi chạy ứng dụng
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
