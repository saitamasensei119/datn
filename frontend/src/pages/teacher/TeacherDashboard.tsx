import React, { useEffect, useState } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { courseApi } from "../../services/api";
import { BookOpen, Users, Clock, TrendingUp } from "lucide-react";

interface Course {
  id: number;
  subjectName: string;
  courseCode: string;
  studentCount?: number;
}

const TeacherDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseApi.getMyCourses();
        setCourses(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu lớp học phần");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <TeacherLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="dashboard-container">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <div className="stats-grid">
          {/* Teaching Courses Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e3f2fd" }}>
              <BookOpen size={32} color="#1976d2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Lớp Đang Giảng Dạy</p>
              <p className="stat-value">{courses.length}</p>
              <span className="stat-change neutral">Học kỳ này</span>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#f3e5f5" }}>
              <Users size={32} color="#7b1fa2" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Tổng Sinh Viên</p>
              <p className="stat-value">
                {courses.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
              </p>
              <span className="stat-change neutral">Đang học</span>
            </div>
          </div>

          {/* Classes Statistics */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#e8f5e9" }}>
              <TrendingUp size={32} color="#388e3c" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Trạng Thái Giảng Dạy</p>
              <p className="stat-value">Tích Cực</p>
              <span className="stat-change positive">100% hoàn thành</span>
            </div>
          </div>

          {/* Clock */}
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "#fff3e0" }}>
              <Clock size={32} color="#f57c00" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Giờ Làm Việc</p>
              <p className="stat-value">8AM - 5PM</p>
              <span className="stat-change neutral">Thứ 2-6</span>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="section">
          <h2 className="section-title">Lớp Học Phần Của Tôi</h2>
          {courses.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa có lớp học phần nào</p>
            </div>
          ) : (
            <div className="courses-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã Lớp</th>
                    <th>Tên Lớp</th>
                    <th>Số Sinh Viên</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.courseCode}</td>
                      <td>{course.subjectName}</td>
                      <td>{course.studentCount || 0}</td>
                      <td>
                        <a
                          href={`/teacher/courses/${course.id}`}
                          className="action-link"
                        >
                          Chi Tiết →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Thao Tác Nhanh</h2>
          <div className="quick-actions">
            <div className="action-card">
              <div className="action-icon">📝</div>
              <h3>Nhập Điểm</h3>
              <p>Nhập điểm cho sinh viên</p>
              <a href="/teacher/grades" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📋</div>
              <h3>Điểm Danh</h3>
              <p>Quản lý điểm danh lớp</p>
              <a href="/teacher/attendance" className="action-link">
                Đi tới →
              </a>
            </div>

            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Báo Cáo</h3>
              <p>Xem báo cáo chi tiết</p>
              <a href="#" className="action-link">
                Đi tới →
              </a>
            </div>
          </div>
        </div>
      </div>

      
    </TeacherLayout>
  );
};

export default TeacherDashboard;
