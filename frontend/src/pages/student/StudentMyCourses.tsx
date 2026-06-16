import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { enrollmentApi } from "../../services/api";
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
  status?: string;
}

const StudentMyCourses: React.FC = () => {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCourses = async () => {
    try {
      const response = await enrollmentApi.getMyEnrollments();
      const data = response.data || [];
      const mappedCourses = data.map((item: any) => ({
        id: item.course?.id || item.id,
        name: item.course?.subjectName || item.subjectName || item.name || "Chưa có tên",
        code: item.course?.courseCode || item.courseCode || item.code || "N/A",
        lecturer: item.course?.lecturerName || item.lecturerName || item.lecturer,
        credits: item.course?.credits || item.credits,
        status: item.course?.status || item.status,
        startDate: item.course?.startDate || item.startDate,
        endDate: item.course?.endDate || item.endDate
      }));
      setCourses(mappedCourses);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu lớp học phần");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUnenroll = async (courseId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký lớp học phần này không?")) return;
    setError("");
    setSuccess("");
    try {
      await enrollmentApi.unenroll(courseId);
      setSuccess("Hủy đăng ký lớp học phần thành công");
      fetchCourses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể hủy đăng ký lớp học phần");
      setTimeout(() => setError(""), 5000);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "OPEN":
        return "#42a5f5";
      case "IN_PROGRESS":
        return "#03a9f4";
      case "COMPLETED":
        return "#1a237e";
      case "CANCELLED":
        return "#e57373";
      case "PLANNED":
        return "#64b5f6";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "OPEN":
        return "Đang Mở Đăng Kí";
      case "IN_PROGRESS":
        return "Đang Học";
      case "COMPLETED":
        return "Kết Thúc";
      case "CANCELLED":
        return "Hủy";
      case "PLANNED":
        return "Chuẩn Bị Mở";
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
        {success && <div className="alert alert-success">{success}</div>}

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
                  {course.status === "OPEN" && (
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ marginRight: "8px" }}
                      onClick={() => handleUnenroll(course.id)}
                    >
                      Hủy Đăng Ký
                    </button>
                  )}
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
