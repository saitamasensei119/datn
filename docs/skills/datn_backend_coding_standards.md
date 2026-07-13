# Skill: Chuẩn Mực Lập Trình Backend Đồ Án DATN (`datn_backend_coding_standards`)

## 📌 Mục Tiêu & Phạm Vi
File này định nghĩa các **tiêu chuẩn bắt buộc (Coding Standards & Rules)** về Kiến trúc Bảo mật, Kiểm tra dữ liệu (Validation) và Xử lý ngoại lệ (Exception Handling) cho hệ thống Backend Spring Boot (`datn-backend`).
Khi AI Agent (hoặc lập trình viên) tham gia viết code, refactor hoặc thêm tính năng mới vào đồ án này, **bắt buộc phải tuân thủ nghiêm ngặt** toàn bộ các quy tắc dưới đây.

---

## 🛑 1. Chuẩn Mực Xử Lý Ngoại Lệ Tập Trung (`Centralized Exception Handling`)

### 1.1 Nguyên Tắc Hoạt Động
- Toàn bộ ngoại lệ phát sinh trong hệ thống phải được thu gom và xử lý tập trung tại `GlobalExceptionHandler.java` (`@RestControllerAdvice`).
- **Tuyệt đối không** trả về lỗi `500 Internal Server Error` kèm Stack Trace thô cho các lỗi nghiệp vụ thông thường hoặc lỗi do người dùng nhập sai.

### 1.2 Cấu Trúc Phản Hồi Lỗi Chuẩn (`ApiErrorResponse`)
Mọi HTTP Response khi có lỗi phải tuân theo cấu trúc DTO chuẩn `ApiErrorResponse.java`:
```json
{
  "status": 400,
  "message": "Mật khẩu mới không được để trống",
  "path": "/auth/reset-password",
  "timestamp": "2026-07-13T08:00:00",
  "validationErrors": {
    "newPassword": "Mật khẩu mới phải có ít nhất 6 ký tự"
  }
}
```

### 1.3 Bảng Ánh Xạ Ngoại Lệ & HTTP Status Code
| Loại Ngoại Lệ / Trường Hợp | HTTP Status Code | Cách Ném Ngoại Lệ Tại Tầng `Service` |
| :--- | :---: | :--- |
| **Lỗi nghiệp vụ / Dữ liệu không hợp lệ** | `400 Bad Request` | `throw new IllegalArgumentException("Thông báo...");`<br>`throw new RuntimeException("Thông báo...");` |
| **Lỗi xác thực (Chưa đăng nhập/Token sai)** | `401 Unauthorized` | Trả về `ResponseEntity.status(401).build();` hoặc thông qua Spring Security |
| **Lỗi phân quyền (Không có quyền Admin...)** | `403 Forbidden` | `AccessDeniedException` |
| **Lỗi không tìm thấy tài nguyên** | `404 Not Found` | `throw new ResourceNotFoundException("...");` |
| **Lỗi trùng lặp dữ liệu / Xung đột DB** | `409 Conflict` | Khi bắt lỗi `DataIntegrityViolationException` hoặc kiểm tra `existsByEmail` |
| **Lỗi hệ thống ngoài ý muốn** | `500 Internal Server Error` | Các ngoại lệ không xác định (`Exception e`) |

---

## 🛡️ 2. Chuẩn Mực Kiểm Tra Dữ Liệu (`Server-side & API Validation`)

Hệ thống áp dụng mô hình bảo vệ 2 lớp (`Two-layer Validation`): **Lớp DTO (`@Valid`)** chặn ngay tại cửa ngõ Controller, và **Lớp Service layer** kiểm tra logic nghiệp vụ sâu trong CSDL.

### 2.1 Quy Tắc Tại Tầng DTO Request
- Mọi DTO nhận dữ liệu từ `@RequestBody` phải sử dụng các annotation của `jakarta.validation.constraints.*`.
- Bắt buộc khai báo thông điệp tiếng Việt thân thiện trong thuộc tính `message = "..."`.
```java
public class CreateUserRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng chuẩn")
    private String email;

    @NotBlank(message = "Mã xác thực OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải bao gồm chính xác 6 chữ số")
    private String token;
}
```

### 2.2 Quy Tắc Tại Tầng Controller
- Bắt buộc phải gắn annotation **`@Valid`** ngay trước `@RequestBody` của các phương thức `POST`, `PUT`.
- Khi `@Valid` phát hiện lỗi, `GlobalExceptionHandler` sẽ tự động gom toàn bộ lỗi vào map `validationErrors` và trả về `400 Bad Request`.

### 2.3 Chuẩn hóa & Kiểm tra nghiệp vụ tại Tầng Service
- **Chuẩn hóa chuỗi (Sanitization/Normalization):** Luôn thực hiện `trim()` và chuyển chữ thường `toLowerCase()` đối với các trường định danh như `email`, `username` trước khi kiểm tra hoặc lưu vào DB để tránh lỗi trùng lặp do phân biệt hoa/thường.
- **Kiểm tra nghiệp vụ sâu:** Luôn kiểm tra sự tồn tại của tài nguyên (VD: `userRepository.existsByEmail(...)`) trước khi tạo mới.

---

## 🔐 3. Chuẩn Mực Bảo Mật & Quản Lý Phiên (`Dual Token & SHA-256 Hash Storage`)

### 3.1 Cơ Chế Dual Token & Bảo Vệ Chống XSS (HttpOnly Cookie)
- Hệ thống áp dụng 2 loại token: **Access Token** (hạn ngắn 15 phút, lưu trong bộ nhớ/Header) và **Refresh Token** (hạn dài 7 ngày).
- **Quy tắc bắt buộc tại `AuthController`:**
  - Khi trả về cặp Token cho Web Client, Refresh Token phải được đóng gói vào **Cookie `HttpOnly`, `Secure`, `SameSite`** thông qua `CookieUtil.createRefreshTokenCookie(...)`.
  - Trước khi trả JSON Body về cho Frontend, **bắt buộc xóa chuỗi Refresh Token khỏi body (`response.setRefreshToken(null)`)** nhằm ngăn chặn tuyệt đối mã độc JavaScript (`XSS`) đọc được token bên phía trình duyệt.

### 3.2 Chuẩn OWASP: Băm SHA-256 Cho Refresh Token (`SHA-256 Hash Storage`)
> [!WARNING]
> **Quy định tối mật:** Tuyệt đối **KHÔNG BAO GIỜ** được lưu chuỗi JWT Refresh Token gốc (`Plain-text JWT`) vào bảng `refresh_tokens` trong cơ sở dữ liệu!

- **Lý do:** Bảo vệ tài khoản người dùng không bị mạo danh ngay cả khi rò rỉ bản sao lưu CSDL (`Database Backup Leak` / `SQL Injection`), đồng thời giúp cây **B-Tree Index của PostgreSQL nhỏ đi 4-5 lần** (`length = 64`).
- **Quy tắc bắt buộc khi code `AuthService`:**
  - Luôn băm chuỗi token gốc bằng tiện ích chuẩn: `TokenHashUtil.sha256(rawToken)`.
  - **Khi Đăng nhập (`login`) & Xoay vòng (`refreshToken`):**
    ```java
    // 1. Tạo chuỗi gốc trả cho Client trong Cookie
    String refreshTokenStr = jwtService.generateRefreshToken(user);
    
    // 2. Chỉ lưu bản băm SHA-256 vào DB
    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setToken(TokenHashUtil.sha256(refreshTokenStr)); // <-- BẮT BUỘC BĂM
    refreshTokenRepository.save(refreshToken);
    ```
  - **Khi Tìm kiếm / Xóa (`refreshToken` / `logout`):**
    ```java
    // Bắt buộc băm Token nhận được từ Client trước khi query DB
    String hashedToken = TokenHashUtil.sha256(request.getRefreshToken());
    RefreshToken token = refreshTokenRepository.findByToken(hashedToken)
            .orElseThrow(() -> new IllegalArgumentException("Refresh token không tồn tại hoặc đã quá hạn"));
    ```

### 3.3 Quy Chuẩn Xóa Token (`Delete on Logout & Refresh`)
Toàn bộ logic làm việc với phiên đăng nhập tuân theo nguyên tắc giữ CSDL sạch (`Clean DB`):
1. **Khi Đăng xuất (`POST /auth/logout`):**
   - Tìm bản ghi theo mã băm SHA-256 và **XÓA THẲNG (`delete`)** khỏi bảng `refresh_tokens`.
2. **Khi Xoay vòng Token (`POST /auth/refresh` - Token Rotation):**
   - Mỗi Refresh Token chỉ có giá trị sử dụng **đúng 1 lần duy nhất (`One-time use`)**.
   - Ngay sau khi xác thực thành công Refresh Token cũ, phải gọi `refreshTokenRepository.delete(refreshToken);` để xóa bản cũ trước khi cấp cặp Token mới.
3. **Cảnh báo chống phát lại (`Replay Attack / Reuse Detection`):**
   - Nếu trong quá trình mở rộng sau này phát hiện một token bị thu hồi (`revoked = true`) lại được đem gửi lên xin cấp mới $\to$ Hệ thống phải lập tức kích hoạt báo động bảo mật, xóa sạch toàn bộ token của User đó (`refreshTokenRepository.deleteByUser(...)`) để khóa tài khoản khẩn cấp.

---

## 📋 4. Checklist Dành Cho AI Agent Khi Viết API Mới
Khi nhận nhiệm vụ tạo thêm API trong `datn-backend`, AI Agent cần tự rà soát theo 5 bước:
1. [ ] Đã tạo DTO Request có đầy đủ `@Valid` annotations (`@NotBlank`, `@Email`, `@Size`) với message tiếng Việt chưa?
2. [ ] Đã gắn `@Valid` vào tham số trong Controller chưa?
3. [ ] Các ngoại lệ trong Service đã ném đúng `IllegalArgumentException` / `RuntimeException` kèm câu chữ rõ ràng chưa?
4. [ ] Nếu có làm việc với Token hoặc dữ liệu nhạy cảm, đã kiểm tra cơ chế băm `TokenHashUtil.sha256` và xóa token `delete` chưa?
5. [ ] Đã kiểm tra biên dịch bằng lệnh `mvn compile -DskipTests` chưa?
