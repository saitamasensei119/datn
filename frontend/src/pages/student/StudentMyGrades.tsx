import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle } from "lucide-react";
import { studentGradeApi } from "../../services/api";
import "./StudentMyGrades.css";

interface GradeResponse {
  courseId: number;
  courseCode: string;
  subjectName: string;
  credits: number;
  midtermScore: number | null;
  midtermStatus: string;
  finalScore: number | null;
  finalStatus: string;
  totalScore: number | null;
  status: string;
}

const getGradeLetter = (total: number | null) => {
  if (total === null || total === undefined) return "-";
  if (total >= 8.5) return "A";
  if (total >= 8.0) return "B+";
  if (total >= 7.0) return "B";
  if (total >= 6.0) return "C+";
  if (total >= 5.0) return "C";
  return "F";
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
    case "F":
      return "#999";
    default:
      return "transparent";
  }
};

const StudentMyGrades: React.FC = () => {
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await studentGradeApi.getMyGrades();
      setGrades(response.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải kết quả học tập.");
    } finally {
      setLoading(false);
    }
  };

  const calculateGPA = () => {
    // Only calculate for courses that have a total score
    const gradedCourses = grades.filter((g) => g.totalScore !== null);
    if (gradedCourses.length === 0) return "0.00";

    const totalCredits = gradedCourses.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = gradedCourses.reduce(
      (sum, g) => sum + (g.totalScore || 0) * g.credits,
      0,
    );
    return totalCredits === 0 ? "0.00" : (weightedSum / totalCredits).toFixed(2);
  };

  const completedCredits = grades
    .filter((g) => g.totalScore !== null && g.totalScore >= 5.0)
    .reduce((sum, g) => sum + g.credits, 0);

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Kết Quả Học Tập</h2>
        </div>

        {loading ? (
           <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải kết quả học tập...</p>
           </div>
        ) : (
          <>
            {/* GPA Summary */}
            <div className="gpa-summary">
              <div className="gpa-card">
                <p className="gpa-label">GPA (Hệ 10)</p>
                <p className="gpa-value">{calculateGPA()}</p>
                <p className="gpa-status">Trung bình tích lũy</p>
              </div>
              <div className="gpa-card">
                <p className="gpa-label">Tín Chỉ Tích Lũy</p>
                <p className="gpa-value">{completedCredits}</p>
                <p className="gpa-status">Đã đạt</p>
              </div>
              <div className="gpa-card">
                <p className="gpa-label">Lớp Đã Đăng Ký</p>
                <p className="gpa-value">{grades.length}</p>
                <p className="gpa-status">Tổng số</p>
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
                      <th style={{ textAlign: "center" }}>TC</th>
                      <th style={{ textAlign: "center" }}>Giữa Kỳ</th>
                      <th style={{ textAlign: "center" }}>Cuối Kỳ</th>
                      <th style={{ textAlign: "center" }}>Điểm Tổng</th>
                      <th style={{ textAlign: "center" }}>Xếp Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                          Bạn chưa đăng ký lớp học phần nào.
                        </td>
                      </tr>
                    ) : (
                      grades.map((grade) => {
                        const letter = getGradeLetter(grade.totalScore);
                        return (
                          <tr key={grade.courseId}>
                            <td className="course-code" style={{ fontWeight: "600", color: "var(--primary)" }}>{grade.courseCode}</td>
                            <td className="course-name">{grade.subjectName}</td>
                            <td className="credits" style={{ textAlign: "center" }}>{grade.credits}</td>
                            <td className="score" style={{ textAlign: "center" }}>
                              <div>{grade.midtermScore !== null ? grade.midtermScore.toFixed(1) : "-"}</div>
                              <div style={{ fontSize: "0.75rem", color: grade.midtermStatus === "Đã gửi ban đào tạo" ? "var(--success)" : "var(--text-secondary)", marginTop: "4px" }}>
                                {grade.midtermStatus}
                              </div>
                            </td>
                            <td className="score" style={{ textAlign: "center" }}>
                              <div>{grade.finalScore !== null ? grade.finalScore.toFixed(1) : "-"}</div>
                              <div style={{ fontSize: "0.75rem", color: grade.finalStatus === "Đã gửi ban đào tạo" ? "var(--success)" : "var(--text-secondary)", marginTop: "4px" }}>
                                {grade.finalStatus}
                              </div>
                            </td>
                            <td className="total-score" style={{ textAlign: "center", fontWeight: "bold" }}>
                              {grade.totalScore !== null ? grade.totalScore.toFixed(2) : "-"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className="grade-badge"
                                style={{ 
                                  backgroundColor: getGradeColor(letter),
                                  color: letter === "-" ? "var(--text-primary)" : "#fff",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontWeight: "bold",
                                  display: "inline-block",
                                  minWidth: "30px"
                                }}
                              >
                                {letter}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scale Information */}
            <div className="scale-info">
              <h3 className="section-title">Bảng Xếp Loại</h3>
              <div className="scale-grid">
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#4caf50" }}>A</span>
                  <span className="scale-range">8.5 - 10.0</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#8bc34a" }}>B+</span>
                  <span className="scale-range">8.0 - 8.4</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#2196f3" }}>B</span>
                  <span className="scale-range">7.0 - 7.9</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#ff9800" }}>C+</span>
                  <span className="scale-range">6.0 - 6.9</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#f44336" }}>C</span>
                  <span className="scale-range">5.0 - 5.9</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#999" }}>F</span>
                  <span className="scale-range">Dưới 5.0</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentMyGrades;
