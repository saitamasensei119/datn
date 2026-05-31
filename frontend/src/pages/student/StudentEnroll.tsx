import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { courseApi } from "../../services/api";
import { BookMarked, Users } from "lucide-react";
import "./StudentEnroll.css";

interface Course {
  id: number;
  name: string;
  code: string;
  lecturer?: string;
  credits?: number;
  studentCount?: number;
}

const StudentEnroll: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
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

  const handleCourseToggle = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      alert("Vui lòng chọn ít nhất một lớp học phần");
      return;
    }

    try {
      // TODO: Call enrollment API for each selected course
      alert(`Đã đăng ký ${selectedCourses.length} lớp học phần thành công!`);
      setSelectedCourses([]);
    } catch (err) {
      alert("Đã xảy ra lỗi trong quá trình đăng ký");
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
          <h2>Đăng Ký Học Phần</h2>
          <span className="selected-count">
            Đã chọn: {selectedCourses.length} lớp
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookMarked size={48} color="var(--text-secondary)" />
            <p>Không có lớp học phần nào để đăng ký</p>
          </div>
        ) : (
          <>
            <div className="courses-grid">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`course-card ${selectedCourses.includes(course.id) ? "selected" : ""}`}
                  onClick={() => handleCourseToggle(course.id)}
                >
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="course-header">
                    <h3>{course.name}</h3>
                    <span className="course-code">{course.code}</span>
                  </div>

                  <div className="course-info">
                    {course.lecturer && (
                      <p className="info-item">
                        <strong>Giảng viên:</strong> {course.lecturer}
                      </p>
                    )}
                    {course.credits && (
                      <p className="info-item">
                        <strong>Tín chỉ:</strong> {course.credits}
                      </p>
                    )}
                    <div className="enrollment-status">
                      <Users size={16} />
                      <span>{course.studentCount || 0} sinh viên</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button
                onClick={handleEnroll}
                className="btn btn-primary"
                disabled={selectedCourses.length === 0}
              >
                Đăng Ký ({selectedCourses.length})
              </button>
              <button
                onClick={() => setSelectedCourses([])}
                className="btn btn-secondary"
              >
                Hủy Chọn
              </button>
            </div>
          </>
        )}
      </div>

      
    </StudentLayout>
  );
};

export default StudentEnroll;
