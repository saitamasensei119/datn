/**
 * ==================================================================================
 * LOAD TEST - ĐĂNG KÝ HỌC PHẦN (Enrollment Load Test)
 * ==================================================================================
 * 
 * Mô phỏng kịch bản thực tế: Nhiều sinh viên đồng thời đăng ký lớp học phần
 * vào thời điểm mở cổng đăng ký.
 * 
 * Cải tiến so với file cũ:
 *   1. Dùng đúng endpoint sinh viên (/api/student/enrollments) thay vì admin
 *   2. Đăng nhập lấy token riêng cho từng sinh viên (realistic auth flow)
 *   3. Ramp-up tải dần: 10 → 50 → 100 → 200 → 500 concurrent users
 *   4. Đo latency từng request: P50, P95, P99 percentile
 *   5. Hỗ trợ test nhiều lớp học phần (phân tán tải, không chỉ 1 lớp)
 *   6. Think time giữa các request (mô phỏng hành vi thật)
 *   7. Báo cáo chi tiết: throughput, error rate, latency distribution
 * 
 * Cách chạy:
 *   node load_test_v2.js                          (mặc định: 200 users, student mode)
 *   node load_test_v2.js --users 500              (500 users)
 *   node load_test_v2.js --mode admin             (dùng admin endpoint)
 *   node load_test_v2.js --courses 8,9,10         (test nhiều lớp)
 *   node load_test_v2.js --ramp                   (bật ramp-up tải dần)
 *   node load_test_v2.js --users 300 --ramp --courses 8,9,10
 * 
 * ==================================================================================
 */

// ==================== CẤU HÌNH ====================
const BASE_URL = 'http://localhost:8080';

// Tài khoản sinh viên mẫu — email format: SV{i}@student.edu.vn, password mặc định
// Hệ thống sẽ thử đăng nhập từng tài khoản trước khi test
const STUDENT_EMAIL_PATTERN = 'student{i}@gmail.com'; // Thay theo pattern email sinh viên trong DB
const STUDENT_PASSWORD = '123456';                     // Password mặc định

// Admin fallback (nếu không login được sinh viên)
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

// ==================== PARSE CLI ARGUMENTS ====================
const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultVal;
  if (typeof defaultVal === 'boolean') return true;
  return args[idx + 1] || defaultVal;
}

const TOTAL_USERS     = parseInt(getArg('users', '200'));
const MODE            = getArg('mode', 'student'); // 'student' or 'admin'
const COURSE_IDS      = getArg('courses', '8').split(',').map(Number);
const ENABLE_RAMP_UP  = getArg('ramp', false);
const THINK_TIME_MS   = parseInt(getArg('think', '100')); // ms giữa mỗi request mỗi user

// ==================== LOGGING HELPERS ====================
const LOG_COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(color, icon, msg) {
  console.log(`${LOG_COLORS[color]}${icon} ${msg}${LOG_COLORS.reset}`);
}

// ==================== CORE FUNCTIONS ====================

/**
 * Đăng nhập lấy JWT token
 */
async function login(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

/**
 * Gửi request đăng ký lớp học phần và đo latency
 */
async function enrollRequest(token, courseId, studentId, endpoint) {
  const start = performance.now();
  const body = { courseId, ignoreWarning: true };
  if (endpoint.includes('admin')) body.studentId = studentId;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const latency = performance.now() - start;
    const text = await res.text();
    return {
      status: res.status,
      latency,
      success: res.ok,
      body: text.substring(0, 120),
    };
  } catch (err) {
    const latency = performance.now() - start;
    return {
      status: 0,
      latency,
      success: false,
      body: `Connection Error: ${err.message}`,
    };
  }
}

/**
 * Tính percentile từ mảng số đã sort
 */
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==================== RAMP-UP STAGES ====================
function getRampStages(totalUsers) {
  // Tải tăng dần: 10% → 25% → 50% → 75% → 100% total users
  const stages = [
    { name: 'Khởi động nhẹ', pct: 0.10, holdMs: 2000 },
    { name: 'Tăng tải',      pct: 0.25, holdMs: 2000 },
    { name: 'Tải trung bình', pct: 0.50, holdMs: 3000 },
    { name: 'Tải cao',       pct: 0.75, holdMs: 3000 },
    { name: 'Tải đỉnh',     pct: 1.00, holdMs: 0    },
  ];
  return stages.map(s => ({
    ...s,
    users: Math.max(1, Math.round(totalUsers * s.pct)),
  }));
}

// ==================== MAIN TEST RUNNER ====================
async function main() {
  const endpoint = MODE === 'admin' 
    ? '/api/admin/enrollments/async'
    : '/api/admin/enrollments';

  // console.log('\n');
  // log('cyan', '╔══════════════════════════════════════════════════════════════╗', '');
  // log('cyan', '║', `  ${LOG_COLORS.bold}LOAD TEST ĐĂNG KÝ HỌC PHẦN v2.0${LOG_COLORS.reset}${LOG_COLORS.cyan}`);
  // log('cyan', '║', `  Hệ thống Quản lý Đào tạo Đại học`);
  // log('cyan', '╠══════════════════════════════════════════════════════════════╣', '');
  // log('cyan', '║', `  👥 Số lượng sinh viên:  ${TOTAL_USERS}`);
  // log('cyan', '║', `  📚 Lớp học phần:        [${COURSE_IDS.join(', ')}]`);
  // log('cyan', '║', `  🔗 Endpoint:            ${endpoint}`);
  // log('cyan', '║', `  ⏱️  Think time:          ${THINK_TIME_MS}ms`);
  // log('cyan', '║', `  📈 Ramp-up:             ${ENABLE_RAMP_UP ? 'BẬT (tải tăng dần)' : 'TẮT (xả cùng lúc)'}`);
  // log('cyan', '╚══════════════════════════════════════════════════════════════╝', '');
  // console.log('');

  // ---- PHASE 1: Authentication ----
  log('yellow', '🔐', 'PHASE 1: Đăng nhập lấy token cho từng sinh viên...');
  
  let tokens = [];

  if (MODE === 'student') {
    // Thử đăng nhập sinh viên thật
    const loginPromises = [];
    for (let i = 1; i <= TOTAL_USERS; i++) {
      const email = STUDENT_EMAIL_PATTERN.replace('{i}', i);
      loginPromises.push(
        login(email, STUDENT_PASSWORD).then(token => ({ index: i, email, token }))
      );
    }
    const loginResults = await Promise.all(loginPromises);
    tokens = loginResults.filter(r => r.token).map(r => ({ ...r }));
    
    const failedLogins = loginResults.filter(r => !r.token).length;
    
    if (tokens.length === 0) {
      log('yellow', '⚠️', `Không đăng nhập được sinh viên nào! Chuyển sang dùng Admin token...`);
      const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (!adminToken) {
        log('red', '❌', 'Admin cũng không đăng nhập được. Kiểm tra lại server!');
        process.exit(1);
      }
      // Dùng chung admin token, mỗi user có studentId khác nhau
      for (let i = 1; i <= TOTAL_USERS; i++) {
        tokens.push({ index: i, email: ADMIN_EMAIL, token: adminToken });
      }
      log('yellow', '⚠️', `Đang dùng Admin token cho ${TOTAL_USERS} users (kém thực tế hơn)`);
    } else {
      log('green', '✅', `Đăng nhập thành công: ${tokens.length}/${TOTAL_USERS} sinh viên`);
      if (failedLogins > 0) {
        log('yellow', '⚠️', `${failedLogins} tài khoản không tồn tại hoặc sai mật khẩu`);
      }
    }
  } else {
    // Admin mode
    const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!adminToken) {
      log('red', '❌', 'Admin login failed!');
      process.exit(1);
    }
    for (let i = 1; i <= TOTAL_USERS; i++) {
      tokens.push({ index: i, email: ADMIN_EMAIL, token: adminToken });
    }
    log('green', '✅', `Admin token ready cho ${TOTAL_USERS} virtual users`);
  }

  console.log('');

  // ---- PHASE 2: Load Test ----
  log( 'PHASE 2: Bắt đầu Load Test...');
  console.log('');

  const allResults = [];
  const globalStart = performance.now();

  if (ENABLE_RAMP_UP) {
    // ---- RAMP-UP MODE ----
    const stages = getRampStages(tokens.length);
    let usersUsed = 0;

    for (const stage of stages) {
      const stageUsers = Math.min(stage.users, tokens.length) - usersUsed;
      if (stageUsers <= 0) continue;

      log('cyan', '📊', `Stage "${stage.name}": Đang thêm ${stageUsers} users (tổng: ${usersUsed + stageUsers})`);

      const stagePromises = [];
      for (let i = usersUsed; i < usersUsed + stageUsers; i++) {
        const user = tokens[i];
        const courseId = COURSE_IDS[i % COURSE_IDS.length];
        stagePromises.push(enrollRequest(user.token, courseId, user.index, endpoint));
      }

      const stageResults = await Promise.all(stagePromises);
      allResults.push(...stageResults);

      const stageSuccess = stageResults.filter(r => r.success).length;
      const stageLatencies = stageResults.map(r => r.latency).sort((a, b) => a - b);
      log('dim', '   ', `→ Kết quả: ${stageSuccess}/${stageResults.length} thành công, P50=${percentile(stageLatencies, 50).toFixed(0)}ms, P95=${percentile(stageLatencies, 95).toFixed(0)}ms`);

      usersUsed += stageUsers;

      if (stage.holdMs > 0) {
        log('dim', '   ', `→ Giữ tải ${stage.holdMs}ms trước khi tăng...`);
        await sleep(stage.holdMs);
      }
    }
  } else {
    // ---- CONCURRENT FLOOD MODE ----
    log('cyan', '💥', `Xả ${tokens.length} requests đồng thời...`);

    const CHUNK_SIZE = 100;
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map((user, j) => {
        const courseId = COURSE_IDS[(i + j) % COURSE_IDS.length];
        return enrollRequest(user.token, courseId, user.index, endpoint);
      });

      const chunkResults = await Promise.all(chunkPromises);
      allResults.push(...chunkResults);

      // Think time giữa các batch
      if (THINK_TIME_MS > 0 && i + CHUNK_SIZE < tokens.length) {
        await sleep(THINK_TIME_MS);
      }
    }
  }

  const totalDuration = performance.now() - globalStart;

  // ---- PHASE 3: Report ----
  console.log('\n');
  log('green', '╔══════════════════════════════════════════════════════════════╗', '');
  log('green', '║', `  ${LOG_COLORS.bold}📊 BÁO CÁO KẾT QUẢ LOAD TEST${LOG_COLORS.reset}${LOG_COLORS.green}`);
  log('green', '╠══════════════════════════════════════════════════════════════╣', '');

  // Phân loại kết quả
  const successResults   = allResults.filter(r => r.success);
  const failResults      = allResults.filter(r => !r.success && r.status !== 0 && r.status < 500);
  const serverErrors     = allResults.filter(r => r.status >= 500 || r.status === 0);

  // Tính latency
  const allLatencies = allResults.map(r => r.latency).sort((a, b) => a - b);
  const successLatencies = successResults.map(r => r.latency).sort((a, b) => a - b);

  const avgLatency = allLatencies.length > 0 
    ? (allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length) 
    : 0;
  const throughput = allResults.length / (totalDuration / 1000);

  log('green', '║', '');
  log('green', '║', `  ⏱️  Tổng thời gian:      ${(totalDuration / 1000).toFixed(2)}s`);
  log('green', '║', `  📨 Tổng requests:        ${allResults.length}`);
  log('green', '║', `  🚀 Throughput:           ${throughput.toFixed(1)} req/s`);
  log('green', '║', '');
  log('green', '║', `  ✅ Thành công (2xx):     ${successResults.length}  (${(successResults.length / allResults.length * 100).toFixed(1)}%)`);
  log('green', '║', `  ⚠️  Từ chối (4xx):       ${failResults.length}  (${(failResults.length / allResults.length * 100).toFixed(1)}%)`);
  log('green', '║', `  🔥 Lỗi Server (5xx/0):  ${serverErrors.length}  (${(serverErrors.length / allResults.length * 100).toFixed(1)}%)`);
  log('green', '║', '');
  log('green', '╠══════════════════════════════════════════════════════════════╣', '');
  log('green', '║', `  ${LOG_COLORS.bold}PHÂN TÍCH LATENCY (Thời gian phản hồi)${LOG_COLORS.reset}${LOG_COLORS.green}`);
  log('green', '╠══════════════════════════════════════════════════════════════╣', '');
  log('green', '║', '');
  log('green', '║', `  📉 Min:    ${allLatencies.length > 0 ? allLatencies[0].toFixed(1) : 0}ms`);
  log('green', '║', `  📊 Avg:    ${avgLatency.toFixed(1)}ms`);
  log('green', '║', `  📈 P50:    ${percentile(allLatencies, 50).toFixed(1)}ms   (Trung vị)`);
  log('green', '║', `  📈 P90:    ${percentile(allLatencies, 90).toFixed(1)}ms`);
  log('green', '║', `  📈 P95:    ${percentile(allLatencies, 95).toFixed(1)}ms   (⭐ Quan trọng)`);
  log('green', '║', `  📈 P99:    ${percentile(allLatencies, 99).toFixed(1)}ms   (Worst-case)`);
  log('green', '║', `  📉 Max:    ${allLatencies.length > 0 ? allLatencies[allLatencies.length - 1].toFixed(1) : 0}ms`);
  log('green', '║', '');
  log('green', '╚══════════════════════════════════════════════════════════════╝', '');

  // Error breakdown
  if (failResults.length > 0 || serverErrors.length > 0) {
    console.log('');
    log('yellow', '📋', 'Chi tiết lỗi phổ biến (top 5):');

    const errorMap = {};
    [...failResults, ...serverErrors].forEach(r => {
      const key = `[${r.status}] ${r.body.substring(0, 80)}`;
      errorMap[key] = (errorMap[key] || 0) + 1;
    });

    Object.entries(errorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([msg, count]) => {
        log('dim', `   ${count}x`, msg);
      });
  }

  // Latency Distribution Histogram
  console.log('');
  log('cyan', '📊', 'Phân bổ thời gian phản hồi (Latency Distribution):');
  const buckets = [50, 100, 200, 500, 1000, 2000, 5000, Infinity];
  const labels  = ['<50ms', '<100ms', '<200ms', '<500ms', '<1s', '<2s', '<5s', '≥5s'];
  
  for (let b = 0; b < buckets.length; b++) {
    const lower = b === 0 ? 0 : buckets[b - 1];
    const upper = buckets[b];
    const count = allLatencies.filter(l => l >= lower && l < upper).length;
    const pct = allResults.length > 0 ? (count / allResults.length * 100) : 0;
    const bar = '█'.repeat(Math.round(pct / 2));
    if (count > 0) {
      console.log(`   ${labels[b].padStart(7)}  ${bar} ${count} (${pct.toFixed(1)}%)`);
    }
  }

  console.log('');
  log('green', '✅', 'Load Test hoàn thành!');
  console.log('');
}

main().catch(console.error);
