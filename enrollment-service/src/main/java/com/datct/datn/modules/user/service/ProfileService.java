package com.datct.datn.modules.user.service;

import com.datct.datn.auth.repository.RefreshTokenRepository;
import com.datct.datn.modules.lecturer.entity.Lecturer;
import com.datct.datn.modules.lecturer.repository.LecturerRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.user.DTO.ChangeAvatarRequest;
import com.datct.datn.modules.user.DTO.ChangePasswordRequest;
import com.datct.datn.modules.user.DTO.UpdatePersonalContactRequest;
import com.datct.datn.modules.user.DTO.UserResponse;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        UserResponse response = UserResponse.fromEntity(user);
        if (user.getRole() == Role.STUDENT) {
            studentRepository.findByUserId(user.getId()).ifPresent(s -> {
                response.setPersonalEmail(s.getPersonalEmail());
                response.setPhoneNumber(s.getPhoneNumber());
            });
        } else if (user.getRole() == Role.TEACHER) {
            lecturerRepository.findByUserId(user.getId()).ifPresent(l -> {
                response.setPersonalEmail(l.getPersonalEmail());
                response.setPhoneNumber(l.getPhoneNumber());
            });
        }
        return response;
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không trùng khớp");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordResetDate(LocalDateTime.now());
        userRepository.save(user);

        // Thu hồi toàn bộ Refresh Token của user này
        refreshTokenRepository.deleteByUser(user);
    }



    @Transactional
    public UserResponse uploadAvatar(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn tệp hình ảnh để tải lên");
        }

        // 1. Kiểm tra dung lượng (< 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Dung lượng tệp không được vượt quá 5MB");
        }

        // 2. Kiểm tra MIME Type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !Arrays.asList("image/jpeg", "image/png", "image/webp", "image/gif").contains(contentType))) {
            throw new RuntimeException("Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, GIF");
        }

        // 3. Kiểm tra Magic Bytes nhị phân (Ngăn chặn RCE/Spoofing)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read < 3 || !isValidImageMagicBytes(header)) {
                throw new RuntimeException("Chữ ký nhị phân tệp (Magic Bytes) không đúng chuẩn hình ảnh. Phát hiện nguy cơ bảo mật!");
            }
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi đọc tệp hình ảnh: " + e.getMessage());
        }

        // 4. Tạo thư mục và tên tệp UUID ngẫu nhiên
        try {
            Path uploadPath = Paths.get("uploads/avatars");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Xóa ảnh cũ nếu là tệp local trong uploads/avatars/
            String oldAvatar = user.getAvatar();
            if (oldAvatar != null && oldAvatar.contains("/uploads/avatars/")) {
                String oldFileName = oldAvatar.substring(oldAvatar.lastIndexOf("/") + 1);
                Path oldFilePath = uploadPath.resolve(oldFileName);
                Files.deleteIfExists(oldFilePath);
            }

            // Xác định phần mở rộng an toàn
            String extension = ".jpg";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
                if (Arrays.asList(".png", ".jpg", ".jpeg", ".webp", ".gif").contains(ext)) {
                    extension = ext;
                }
            }

            String newFilename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Cập nhật URL đường dẫn tương đối /uploads/avatars/ (tránh hardcode localhost cho Mobile App)
            String avatarUrl = "/uploads/avatars/" + newFilename;
            user.setAvatar(avatarUrl);
            userRepository.save(user);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu tệp hình ảnh: " + e.getMessage());
        }

        return getProfile(email);
    }

    private boolean isValidImageMagicBytes(byte[] header) {
        // JPEG/JPG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) return true;
        // PNG: 89 50 4E 47
        if (header[0] == (byte) 0x89 && header[1] == (byte) 0x50 && header[2] == (byte) 0x4E && header[3] == (byte) 0x47) return true;
        // GIF: 47 49 46 (GIF)
        if (header[0] == (byte) 0x47 && header[1] == (byte) 0x49 && header[2] == (byte) 0x46) return true;
        // WEBP: RIFF...WEBP -> bytes 0..3 is 'RIFF' (52 49 46 46)
        if (header[0] == (byte) 0x52 && header[1] == (byte) 0x49 && header[2] == (byte) 0x46 && header[3] == (byte) 0x46) return true;
        return false;
    }

    @Transactional
    public UserResponse updateContact(String email, UpdatePersonalContactRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin sinh viên"));
            student.setPersonalEmail(request.getPersonalEmail());
            student.setPhoneNumber(request.getPhoneNumber());
            studentRepository.save(student);
        } else if (user.getRole() == Role.TEACHER) {
            Lecturer lecturer = lecturerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin giảng viên"));
            lecturer.setPersonalEmail(request.getPersonalEmail());
            lecturer.setPhoneNumber(request.getPhoneNumber());
            lecturerRepository.save(lecturer);
        }
        return getProfile(email);
    }
}
