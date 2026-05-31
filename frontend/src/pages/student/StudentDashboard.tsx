import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StudentLayout from "../../components/StudentLayout";
import { BookOpen, Award, ClipboardList, TrendingUp } from "lucide-react";
import "./StudentDashboard.css";
interface StudentStats {
  enrolledCourses: number;
  gpa: number;
  completedCourses: number;
  credits: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 5,
    gpa: 3.5,
    completedCourses: 12,
    credits: 36,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="dashboard-container">
        <div className="welcome-section">
          <h2>Chào mừng, {user?.email}!</h2>
          <p>Đây là tổng quan về học tập của bạn</p>
        </div>

        <div className="stats-grid">
          {/* Enrolled Courses Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e3f2fd" }}>
              <BookOpen size={32} color="#1976d2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Lớp Đang Học</p>
              <p className="stat-value">{stats.enrolledCourses}</p>
              <span className="stat-change neutral">Học kỳ này</span>
            </div>
          </div>

          {/* GPA Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#f3e5f5" }}>
              <Award size={32} color="#7b1fa2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">GPA</p>
              <p className="stat-value">{stats.gpa.toFixed(2)}</p>
              <span className="stat-change positive">Rất tốt</span>
            </div>
          </div>

          {/* Completed Courses Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e8f5e9" }}>
              <ClipboardList size={32} color="#388e3c" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Lớp Đã Học</p>
              <p className="stat-value">{stats.completedCourses}</p>
              <span className="stat-change neutral">Tổng cộng</span>
            </div>
          </div>

          {/* Credits Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#fff3e0" }}>
              <TrendingUp size={32} color="#f57c00" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tín Chỉ</p>
              <p className="stat-value">{stats.credits}</p>
              <span className="stat-change neutral">Đã hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Thao Tác Nhanh</h2>
          <div className="quick-actions">
            <div className="action-card">
              <div className="action-icon">📚</div>
              <h3>Đăng Ký Học Phần</h3>
              <p>Đăng ký các lớp mới cho học kỳ này</p>
              <a href="/student/enroll" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📖</div>
              <h3>Lớp Của Tôi</h3>
              <p>Xem danh sách lớp đang học</p>
              <a href="/student/my-courses" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Kết Quả Học Tập</h3>
              <p>Xem điểm số của bạn</p>
              <a href="/student/my-grades" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">🎓</div>
              <h3>Bảng Điểm</h3>
              <p>Xem bảng điểm toàn khóa</p>
              <a href="/student/transcript" className="action-link">
                Đi tới →
              </a>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="section">
          <h2 className="section-title">Thông Báo Gần Đây</h2>
          <div className="notifications">
            <div className="notification-item">
              <div className="notification-icon">ℹ️</div>
              <div className="notification-content">
                <p className="notification-title">Cập nhật lịch thi</p>
                <p className="notification-text">
                  Lịch thi cuối kỳ HK1 2023-2024 đã được cập nhật
                </p>
                <span className="notification-time">2 ngày trước</span>
              </div>
            </div>

            <div className="notification-item">
              <div className="notification-icon">✓</div>
              <div className="notification-content">
                <p className="notification-title">Điểm đã công bố</p>
                <p className="notification-text">
                  Giáo viên đã công bố điểm cho môn Toán Rời Rạc
                </p>
                <span className="notification-time">5 ngày trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </StudentLayout>
  );
};

export default StudentDashboard;
