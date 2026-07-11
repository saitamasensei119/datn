package com.datct.datn.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Slf4j
public class ExcelSecurityUtil {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".xlsx", ".xls");

    /**
     * Kiểm tra bảo mật 3 lớp cho tệp Excel (Dung lượng, phần mở rộng, và Magic Bytes nhị phân).
     *
     * @param file          Tệp MultipartFile tải lên từ người dùng
     * @param maxSizeBytes Giới hạn dung lượng tối đa cho phép (byte)
     */
    public static void validateExcelFile(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Tệp Excel tải lên không được rỗng!");
        }

        // 1. Kiểm tra giới hạn dung lượng (Size Check - Chống DoS / Zip Bomb từ file khổng lồ)
        if (file.getSize() > maxSizeBytes) {
            long maxMb = maxSizeBytes / (1024 * 1024);
            throw new RuntimeException("Dung lượng tệp Excel vượt quá giới hạn cho phép (" + maxMb + "MB)!");
        }

        // 2. Kiểm tra phần mở rộng (Extension Check)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new RuntimeException("Tên tệp không hợp lệ!");
        }
        String lowerName = originalFilename.toLowerCase();
        boolean validExt = ALLOWED_EXTENSIONS.stream().anyMatch(lowerName::endsWith);
        if (!validExt) {
            throw new RuntimeException("Chỉ chấp nhận tệp định dạng Excel (.xlsx hoặc .xls)!");
        }

        // 3. Kiểm tra chữ ký nhị phân (Magic Bytes Check - Chống giả mạo đuôi file)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int bytesRead = is.read(header);
            if (bytesRead < 4) {
                throw new RuntimeException("Tệp tải lên bị hỏng hoặc quá nhỏ!");
            }

            boolean isXlsx = (header[0] == (byte) 0x50 && header[1] == (byte) 0x4B &&
                              header[2] == (byte) 0x03 && header[3] == (byte) 0x04); // PK\x03\x04 (ZIP format cho .xlsx)

            boolean isXls = (header[0] == (byte) 0xD0 && header[1] == (byte) 0xCF &&
                             header[2] == (byte) 0x11 && header[3] == (byte) 0xE0);  // OLE2 format cho .xls

            if (!isXlsx && !isXls) {
                log.warn("CẢNH BÁO BẢO MẬT: Phát hiện tệp giả mạo định dạng Excel! Filename: {}", originalFilename);
                throw new RuntimeException("Chữ ký nhị phân không hợp lệ! Tệp không phải định dạng Excel thực sự.");
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra chữ ký nhị phân tệp Excel", e);
            throw new RuntimeException("Không thể xác thực tệp Excel: " + e.getMessage());
        }
    }

    /**
     * Lọc và vô hiệu hóa các ký tự độc hại trong chuỗi ô Excel (Chống Formula/CSV Injection và Stored XSS).
     *
     * @param raw Chuỗi gốc đọc từ ô Excel
     * @return Chuỗi đã được làm sạch
     */
    public static String sanitizeCellString(String raw) {
        if (raw == null) {
            return "";
        }
        String cleaned = raw.trim();
        if (cleaned.isEmpty()) {
            return "";
        }

        // 4a. Chống Formula / CSV Injection (=, +, -, @)
        // Nếu chuỗi bắt đầu bằng dấu công thức, thêm dấu nháy đơn để biến thành chuỗi văn bản thuần túy
        if (cleaned.startsWith("=") || cleaned.startsWith("+") || cleaned.startsWith("-") || cleaned.startsWith("@")) {
            cleaned = "'" + cleaned;
        }

        // 4b. Chống Stored XSS - Loại bỏ các thẻ script và iframe độc hại
        cleaned = cleaned.replaceAll("(?i)<script.*?>.*?</script>", "")
                         .replaceAll("(?i)<iframe.*?>.*?</iframe>", "");

        return cleaned;
    }
}
