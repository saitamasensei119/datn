import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";
import {
  Users,
  BookOpen,
  GraduationCap,
  CalendarRange,
  TrendingUp,
} from "lucide-react";
import "./AdminDashboard.css";
interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalSemesters: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalSemesters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard stats
    const timer = setTimeout(() => {
      setStats({
        totalStudents: 1250,
        totalTeachers: 85,
        totalCourses: 156,
        totalSemesters: 4,
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="stats-grid">
          {/* Students Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e3f2fd" }}>
              <Users size={32} color="#1976d2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Sinh Viên</p>
              <p className="stat-value">{stats.totalStudents}</p>
              <span className="stat-change positive">+5% từ tháng trước</span>
            </div>
          </div>

          {/* Teachers Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#f3e5f5" }}>
              <GraduationCap size={32} color="#7b1fa2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Giảng Viên</p>
              <p className="stat-value">{stats.totalTeachers}</p>
              <span className="stat-change neutral">Không thay đổi</span>
            </div>
          </div>

          {/* Courses Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e8f5e9" }}>
              <BookOpen size={32} color="#388e3c" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Lớp Học Phần</p>
              <p className="stat-value">{stats.totalCourses}</p>
              <span className="stat-change positive">+8 lớp mới</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Thao Tác Nhanh</h2>
          <div className="quick-actions">
            <div className="action-card">
              <div className="action-icon">👥</div>
              <h3>Quản Lý Sinh Viên</h3>
              <p>Thêm, sửa hoặc xóa sinh viên</p>
              <a href="/admin/students" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📚</div>
              <h3>Quản Lý Môn Học</h3>
              <p>Cập nhật danh sách môn học</p>
              <a href="/admin/subjects" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📅</div>
              <h3>Quản Lý Học Kỳ</h3>
              <p>Thiết lập các học kỳ mới</p>
              <a href="/admin/semesters" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">🏫</div>
              <h3>Quản Lý Khoa</h3>
              <p>Quản lý các khoa và ngành</p>
              <a href="/admin/departments" className="action-link">
                Đi tới →
              </a>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="section">
          <h2 className="section-title">Thông Tin Hệ Thống</h2>
          <div className="info-box">
            <p>
              <strong>Quản Trị Viên:</strong> {user?.email}
            </p>
            <p>
              <strong>Quyền Hạn:</strong> Quản lý toàn bộ hệ thống
            </p>
            <p>
              <strong>Trạng Thái:</strong>{" "}
              <span className="badge badge-success">Hoạt Động</span>
            </p>
          </div>
        </div>
      </div>

      
    </AdminLayout>
  );
};

export default AdminDashboard;
