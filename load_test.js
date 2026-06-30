// THIẾT LẬP THÔNG SỐ TEST
const BASE_URL = 'http://localhost:8080';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4MjM4NDU0NSwiZXhwIjoxNzgyNDcwOTQ1fQ.hV_WEKU1scdgPYgt2IVmJqhGArVMvMdRdEub-SpvNrs';
const COURSE_ID = 8; // Chọn 1 Lớp học phần trống

const args = process.argv.slice(2);
const TOTAL_REQUESTS = parseInt(args[0]) || 2000;
const MODE = args[1] === 'new' ? 'new' : 'old'; 
const TARGET_URL = MODE === 'new' 
  ? `${BASE_URL}/api/admin/enrollments/async`
  : `${BASE_URL}/api/admin/enrollments`;

// Gửi request nhưng KHÔNG ĐỢI (Non-blocking fire)
function fireRequest(studentId) {
  const payload = { studentId, courseId: COURSE_ID, ignoreWarning: true };
  
  return fetch(TARGET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(payload)
  }).then(async res => {
    const text = await res.text();
    return res.ok ? text : `Error: ${text}`;
  }).catch(err => `Error: ${err.message}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTsunamiTest() {
  const modeName = MODE === 'new' ? 'KIẾN TRÚC MỚI (RabbitMQ + Lock)' : 'KIẾN TRÚC CŨ (Monolith Sync)';
  console.log(`=============================================================`);
  console.log(`🌊 BẮT ĐẦU KỊCH BẢN TSUNAMI FLOOD: ${modeName}`);
  console.log(`🎯 Mục tiêu: ${TOTAL_REQUESTS} requests dồn dập không nghỉ vào Lớp ID = ${COURSE_ID}`);
  console.log(`=============================================================\n`);

  const startTime = Date.now();
  const allPromises = [];
  const CHUNK_SIZE = 250; // Mỗi 20ms nhả 250 TCP Sockets vào OS

  console.log(`🚀 Đang xả lũ ${TOTAL_REQUESTS} requests vào máy chủ...`);

  for (let i = 1; i <= TOTAL_REQUESTS; i += CHUNK_SIZE) {
    const chunkCount = Math.min(CHUNK_SIZE, TOTAL_REQUESTS - i + 1);
    for (let j = 0; j < chunkCount; j++) {
      allPromises.push(fireRequest(i + j));
    }
    // Nghỉ 20ms giữa các đợt nhả socket để hệ điều hành Windows không khóa cổng mạng,
    // nhưng KHÔNG dùng await Promise.all -> Máy chủ Spring Boot sẽ hứng chịu toàn bộ cùng lúc!
    await sleep(20); 
  }

  console.log(`💥 Đã xả xong toàn bộ sockets trong ${Date.now() - startTime} ms! Đang đợi máy chủ gồng mình xử lý...`);

  const results = await Promise.all(allPromises);
  const duration = Date.now() - startTime;

  let successCount = 0;
  let errorCount = 0;
  let timeoutCount = 0;

  results.forEach(res => {
    if (res === 'Enroll success' || res.includes('RabbitMQ')) successCount++;
    else if (res.includes('timed out') || res.includes('500') || res.includes('504')) timeoutCount++;
    else errorCount++;
  });

  console.log(`\n📊 --- KẾT QUẢ xẢ LŨ ${TOTAL_REQUESTS} REQUESTS ---`);
  console.log(`⏱️ Tổng thời gian chịu đựng: ${duration} ms (~${ (duration/1000).toFixed(2) } giây)`);
  console.log(`✅ Thành Công (HTTP 200/202): ${successCount}`);
  console.log(`❌ Từ chối bình thường (DB Full hoặc hết sĩ số): ${errorCount}`);
  console.log(`🔥 SẬP SERVER (Lỗi 500/504 / Connection Pool Timeout): ${timeoutCount}`);
  console.log(`=============================================================\n`);
}

runTsunamiTest();
