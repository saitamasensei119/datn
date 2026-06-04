import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/AdminLayout";
import {
  Users,
  BookOpen,
  GraduationCap,
  CalendarRange,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  studentApi,
  lecturerApi,
  courseApi,
  semesterApi,
} from "../../services/api";
import "./AdminDashboard.css";

interface DashboardStats {
  activeStudents: number;
  suspendedStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalSemesters: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: 0,
    suspendedStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalSemesters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [studentStats, teachersRes, coursesRes, semestersRes] =
          await Promise.all([
            studentApi.getStats(),
            lecturerApi.getAll(),
            courseApi.getAll(),
            semesterApi.getAll(),
          ]);

        setStats({
          activeStudents: studentStats.data.activeCount || 0,
          suspendedStudents: studentStats.data.suspendedCount || 0,
          totalTeachers: teachersRes.data?.length || 0,
          totalCourses: coursesRes.data?.length || 0,
          totalSemesters: semestersRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Không thể tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
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
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={18} style={{ marginRight: "8px" }} />
            {error}
          </div>
        )}

        <div className="stats-grid">
          {/* Active Students Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e8f5e9" }}>
              <Users size={32} color="#2e7d32" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Sinh Viên Đang Học</p>
              <p className="stat-value">{stats.activeStudents}</p>
              <span className="stat-change positive">Đang học</span>
            </div>
          </div>

          {/* Suspended Students Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#ffebee" }}>
              <Users size={32} color="#c62828" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Sinh Viên Tạm Ngưng Học</p>
              <p className="stat-value">{stats.suspendedStudents}</p>
              <span className="stat-change negative">Tạm ngưng học</span>
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
              <span className="stat-change neutral">Hoạt động</span>
            </div>
          </div>

          {/* Courses Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e3f2fd" }}>
              <BookOpen size={32} color="#1976d2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Lớp Học Phần</p>
              <p className="stat-value">{stats.totalCourses}</p>
              <span className="stat-change positive">Học kỳ này</span>
            </div>
          </div>

          {/* Semesters Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#fff3e0" }}>
              <CalendarRange size={32} color="#f57c00" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Học Kỳ</p>
              <p className="stat-value">{stats.totalSemesters}</p>
              <span className="stat-change neutral">Năm học</span>
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
