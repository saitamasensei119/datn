import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
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

const getGradeInfo = (total: number | null) => {
  if (total === null || total === undefined) return { letter: "-", point: 0, color: "transparent" };
  if (total >= 9.5) return { letter: "A+", point: 4.0, color: "#4caf50" };
  if (total >= 8.5) return { letter: "A", point: 4.0, color: "#4caf50" };
  if (total >= 8.0) return { letter: "B+", point: 3.5, color: "#8bc34a" };
  if (total >= 7.0) return { letter: "B", point: 3.0, color: "#2196f3" };
  if (total >= 6.5) return { letter: "C+", point: 2.5, color: "#ff9800" };
  if (total >= 5.5) return { letter: "C", point: 2.0, color: "#ff9800" };
  if (total >= 5.0) return { letter: "D+", point: 1.5, color: "#f44336" };
  if (total >= 4.0) return { letter: "D", point: 1.0, color: "#f44336" };
  return { letter: "F", point: 0.0, color: "#999" };
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
    const gradedCourses = grades.filter((g) => g.totalScore !== null);
    if (gradedCourses.length === 0) return "0.00";

    const totalCredits = gradedCourses.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = gradedCourses.reduce(
      (sum, g) => sum + getGradeInfo(g.totalScore).point * g.credits,
      0,
    );
    return totalCredits === 0 ? "0.00" : (weightedSum / totalCredits).toFixed(2);
  };

  const completedCredits = grades
    .filter((g) => g.totalScore !== null && g.totalScore >= 4.0)
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

            <div className="grades-section">
              <h3 className="section-title">Chi Tiết Điểm Số</h3>
              <div className="table-responsive">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Mã MH</th>
                      <th>Tên Môn Học</th>
                      <th style={{ textAlign: "center" }}>Tín Chỉ</th>
                      <th style={{ textAlign: "center" }}>Điểm GK</th>
                      <th style={{ textAlign: "center" }}>Điểm CK</th>
                      <th style={{ textAlign: "center" }}>Điểm Tổng Hệ 10</th>
                      <th style={{ textAlign: "center" }}>Điểm Hệ 4</th>
                      <th style={{ textAlign: "center" }}>Điểm Chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>
                          Bạn chưa đăng ký lớp học phần nào.
                        </td>
                      </tr>
                    ) : (
                      grades.map((grade, index) => {
                        const gradeInfo = getGradeInfo(grade.totalScore);
                        return (
                          <tr key={index}>
                            <td className="course-code">{grade.courseCode}</td>
                            <td className="subject-name">{grade.subjectName}</td>
                            <td style={{ textAlign: "center" }}>{grade.credits}</td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: '500' }}>{grade.midtermScore !== null ? grade.midtermScore.toFixed(1) : "-"}</span>
                                <span style={{ fontSize: '0.75rem', color: grade.midtermStatus === "Đã gửi ban đào tạo" ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                  {grade.midtermStatus === "Đã gửi ban đào tạo" ? "Đã duyệt" : "Chưa duyệt"}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: '500' }}>{grade.finalScore !== null ? grade.finalScore.toFixed(1) : "-"}</span>
                                <span style={{ fontSize: '0.75rem', color: grade.finalStatus === "Đã gửi ban đào tạo" ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                  {grade.finalStatus === "Đã gửi ban đào tạo" ? "Đã duyệt" : "Chưa duyệt"}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: "center", fontWeight: "bold" }}>
                              {grade.totalScore !== null ? grade.totalScore.toFixed(2) : "-"}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: "bold", color: "var(--primary)" }}>
                              {grade.totalScore !== null ? gradeInfo.point.toFixed(1) : "-"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {grade.totalScore !== null ? (
                                <span
                                  className="grade-badge"
                                  style={{
                                    backgroundColor: gradeInfo.color,
                                    color: "white",
                                  }}
                                >
                                  {gradeInfo.letter}
                                </span>
                              ) : (
                                "-"
                              )}
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
                  <span className="scale-grade" style={{ backgroundColor: "#4caf50" }}>A+</span>
                  <span className="scale-range">9.5 - 10.0</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#4caf50" }}>A</span>
                  <span className="scale-range">8.5 - 9.4</span>
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
                  <span className="scale-range">6.5 - 6.9</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#ff9800" }}>C</span>
                  <span className="scale-range">5.5 - 6.4</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#f44336" }}>D+</span>
                  <span className="scale-range">5.0 - 5.4</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#f44336" }}>D</span>
                  <span className="scale-range">4.0 - 4.9</span>
                </div>
                <div className="scale-item">
                  <span className="scale-grade" style={{ backgroundColor: "#999" }}>F</span>
                  <span className="scale-range">Dưới 4.0</span>
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
