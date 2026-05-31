import React, { useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle } from "lucide-react";
import "./StudentMyGrades.css";

interface Grade {
  id: number;
  courseCode: string;
  courseName: string;
  lecturer: string;
  credits: number;
  midtermScore: number;
  finalScore: number;
  totalScore: number;
  grade: string;
}

const StudentMyGrades: React.FC = () => {
  const [grades] = useState<Grade[]>([
    {
      id: 1,
      courseCode: "CS101",
      courseName: "Toán Rời Rạc",
      lecturer: "TS. Nguyễn Văn A",
      credits: 3,
      midtermScore: 8.0,
      finalScore: 7.5,
      totalScore: 7.7,
      grade: "A",
    },
    {
      id: 2,
      courseCode: "CS102",
      courseName: "Lập Trình C++",
      lecturer: "TS. Trần Thị B",
      credits: 4,
      midtermScore: 9.0,
      finalScore: 8.5,
      totalScore: 8.8,
      grade: "A",
    },
    {
      id: 3,
      courseCode: "CS103",
      courseName: "Cơ Sở Dữ Liệu",
      lecturer: "TS. Lê Văn C",
      credits: 3,
      midtermScore: 7.0,
      finalScore: 7.5,
      totalScore: 7.3,
      grade: "B+",
    },
    {
      id: 4,
      courseCode: "CS104",
      courseName: "Kiến Trúc Máy Tính",
      lecturer: "TS. Phạm Minh D",
      credits: 3,
      midtermScore: 6.5,
      finalScore: 7.0,
      totalScore: 6.8,
      grade: "B",
    },
  ]);

  const calculateGPA = () => {
    const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = grades.reduce(
      (sum, g) => sum + g.totalScore * g.credits,
      0,
    );
    return (weightedSum / totalCredits).toFixed(2);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "#4caf50";
      case "B+":
        return "#8bc34a";
      case "B":
        return "#2196f3";
      case "C+":
        return "#ff9800";
      case "C":
        return "#f44336";
      default:
        return "#666";
    }
  };

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Kết Quả Học Tập</h2>
        </div>

        {/* GPA Summary */}
        <div className="gpa-summary">
          <div className="gpa-card">
            <p className="gpa-label">GPA Hiện Tại</p>
            <p className="gpa-value">{calculateGPA()}</p>
            <p className="gpa-status">Rất Tốt</p>
          </div>
          <div className="gpa-card">
            <p className="gpa-label">Tổng Tín Chỉ</p>
            <p className="gpa-value">
              {grades.reduce((sum, g) => sum + g.credits, 0)}
            </p>
            <p className="gpa-status">Đã Hoàn Thành</p>
          </div>
          <div className="gpa-card">
            <p className="gpa-label">Lớp Đã Học</p>
            <p className="gpa-value">{grades.length}</p>
            <p className="gpa-status">Toàn Bộ</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="grades-section">
          <h3 className="section-title">Chi Tiết Điểm Số</h3>
          <div className="grades-table">
            <table>
              <thead>
                <tr>
                  <th>Mã Lớp</th>
                  <th>Tên Môn Học</th>
                  <th>Giảng Viên</th>
                  <th>TC</th>
                  <th>Giữa Kỳ</th>
                  <th>Cuối Kỳ</th>
                  <th>Điểm Tổng</th>
                  <th>Xếp Loại</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="course-code">{grade.courseCode}</td>
                    <td className="course-name">{grade.courseName}</td>
                    <td className="lecturer">{grade.lecturer}</td>
                    <td className="credits">{grade.credits}</td>
                    <td className="score">{grade.midtermScore.toFixed(1)}</td>
                    <td className="score">{grade.finalScore.toFixed(1)}</td>
                    <td className="total-score">
                      {grade.totalScore.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className="grade-badge"
                        style={{ backgroundColor: getGradeColor(grade.grade) }}
                      >
                        {grade.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scale Information */}
        <div className="scale-info">
          <h3 className="section-title">Bảng Xếp Loại</h3>
          <div className="scale-grid">
            <div className="scale-item">
              <span
                className="scale-grade"
                style={{ backgroundColor: "#4caf50" }}
              >
                A
              </span>
              <span className="scale-range">8.5 - 10.0</span>
            </div>
            <div className="scale-item">
              <span
                className="scale-grade"
                style={{ backgroundColor: "#8bc34a" }}
              >
                B+
              </span>
              <span className="scale-range">8.0 - 8.4</span>
            </div>
            <div className="scale-item">
              <span
                className="scale-grade"
                style={{ backgroundColor: "#2196f3" }}
              >
                B
              </span>
              <span className="scale-range">7.0 - 7.9</span>
            </div>
            <div className="scale-item">
              <span
                className="scale-grade"
                style={{ backgroundColor: "#ff9800" }}
              >
                C+
              </span>
              <span className="scale-range">6.0 - 6.9</span>
            </div>
            <div className="scale-item">
              <span
                className="scale-grade"
                style={{ backgroundColor: "#f44336" }}
              >
                C
              </span>
              <span className="scale-range">5.0 - 5.9</span>
            </div>
            <div className="scale-item">
              <span className="scale-grade" style={{ backgroundColor: "#999" }}>
                F
              </span>
              <span className="scale-range">Dưới 5.0</span>
            </div>
          </div>
        </div>
      </div>

      
    </StudentLayout>
  );
};

export default StudentMyGrades;
