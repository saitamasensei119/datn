import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { courseApi } from "../../services/api";
import { BookOpen } from "lucide-react";
import "./StudentMyCourses.css";

interface MyCourse {
  id: number;
  name: string;
  code: string;
  lecturer?: string;
  credits?: number;
  startDate?: string;
  endDate?: string;
  status?: "ongoing" | "completed" | "upcoming";
}

const StudentMyCourses: React.FC = () => {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseApi.getAll();
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ongoing":
        return "#4caf50";
      case "completed":
        return "#2196f3";
      case "upcoming":
        return "#ff9800";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "ongoing":
        return "Đang Học";
      case "completed":
        return "Đã Hoàn Thành";
      case "upcoming":
        return "Sắp Tới";
      default:
        return "Không Xác Định";
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="page-container">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="page-header">
          <h2>Lớp Học Phần Của Tôi</h2>
          <span className="course-count">Tổng: {courses.length} lớp</span>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} color="var(--text-secondary)" />
            <p>Bạn chưa đăng ký lớp học phần nào</p>
            <a href="/student/enroll" className="btn btn-primary">
              Đăng Ký Ngay
            </a>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map((course) => (
              <div key={course.id} className="course-item">
                <div className="course-main">
                  <div className="course-info">
                    <h3 className="course-name">{course.name}</h3>
                    <p className="course-code">{course.code}</p>
                    {course.lecturer && (
                      <p className="course-lecturer">
                        <strong>Giảng viên:</strong> {course.lecturer}
                      </p>
                    )}
                  </div>
                  <div className="course-details">
                    {course.credits && (
                      <div className="detail-item">
                        <span className="label">Tín chỉ:</span>
                        <span className="value">{course.credits}</span>
                      </div>
                    )}
                    {course.startDate && (
                      <div className="detail-item">
                        <span className="label">Thời gian:</span>
                        <span className="value">
                          {course.startDate} - {course.endDate}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="course-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(course.status) }}
                    >
                      {getStatusLabel(course.status)}
                    </span>
                  </div>
                </div>
                <div className="course-actions">
                  <a
                    href={`/student/my-courses/${course.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Chi Tiết
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
    </StudentLayout>
  );
};

export default StudentMyCourses;
