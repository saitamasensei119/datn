import React, { useEffect, useState } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { courseApi } from "../../services/api";
import { BookOpen, Users, Filter } from "lucide-react";
import "./TeacherCourses.css";

interface Course {
  id: number;
  name: string;
  code: string;
  studentCount?: number;
}

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
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

  if (loading) {
    return (
      <TeacherLayout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="page-container">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="page-header">
          <h2>Lớp Học Phần</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Tìm kiếm lớp..."
              className="search-input"
            />
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} color="var(--text-secondary)" />
            <p>Bạn chưa có lớp học phần nào</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <span className="course-code">{course.code}</span>
                </div>
                <div className="course-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span>{course.studentCount || 0} sinh viên</span>
                  </div>
                </div>
                <div className="course-actions">
                  <a
                    href={`/teacher/courses/${course.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Xem Chi Tiết
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
    </TeacherLayout>
  );
};

export default TeacherCourses;
