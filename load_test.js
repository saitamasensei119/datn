const axios = require('axios');

// THIẾT LẬP THÔNG SỐ TEST
const BASE_URL = 'http://localhost:8080';
const ADMIN_TOKEN = 'ĐIỀN_TOKEN_ADMIN_VÀO_ĐÂY'; // Lấy token từ local storage khi login admin
const COURSE_ID = 1; // Chọn 1 Lớp học phần trống có sĩ số tối đa (ví dụ 40)
const CONCURRENT_REQUESTS = 200; // Số lượng request gửi ĐỒNG THỜI cùng 1 lúc

async function testOldCode() {
  console.log(`Bắt đầu test CŨ (Có thể bị Race Condition/Crash) với ${CONCURRENT_REQUESTS} requests...`);
  
  const requests = [];
  
  for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
    // Gọi thẳng vào API cũ của Admin (Không qua RabbitMQ, Không dùng Pessimistic Lock)
    // Giả sử có sẵn các studentId từ 1 đến 200 trong DB
    const payload = {
      studentId: i,
      courseId: COURSE_ID,
      ignoreWarning: true
    };

    const req = axios.post(`${BASE_URL}/api/admin/enrollments`, payload, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    }).catch(err => err.response ? err.response.data : err.message);
    
    requests.push(req);
  }

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const endTime = Date.now();

  let successCount = 0;
  let errorCount = 0;

  results.forEach(res => {
    if (res === 'Enroll success') successCount++;
    else errorCount++;
  });

  console.log(`\n--- KẾT QUẢ TEST MÃ CŨ ---`);
  console.log(`Thời gian xử lý: ${endTime - startTime} ms`);
  console.log(`Thành công (Đã ghi vào DB): ${successCount}`);
  console.log(`Thất bại (Bị từ chối): ${errorCount}`);
  console.log(`\n=> HÃY KIỂM TRA LẠI DATABASE: Sĩ số tối đa của lớp học là bao nhiêu? Số lượng đăng ký thành công (${successCount}) có vượt quá sĩ số không? Nếu có, hệ thống đã dính Race Condition!`);
}

testOldCode();
