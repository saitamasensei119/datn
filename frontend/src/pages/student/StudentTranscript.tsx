import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { Download } from "lucide-react";
import { studentGradeApi } from "../../services/api";
import "./StudentTranscript.css";

interface TranscriptResponse {
  semesterName: string;
  courseCode: string;
  subjectName: string;
  credits: number;
  totalScore: number;
  gradePoint: number;
  letterGrade: string;
  isPassed: boolean;
}

const StudentTranscript: React.FC = () => {
  const [transcripts, setTranscripts] = useState<TranscriptResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const response = await studentGradeApi.getTranscript();
      setTranscripts(response.data);
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    alert("Bảng điểm sẽ được tải xuống dưới dạng PDF");
  };

  const groupedTranscripts = transcripts.reduce(
    (acc, record) => {
      const key = record.semesterName || "Chưa xác định";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    },
    {} as Record<string, TranscriptResponse[]>,
  );

  const totalRegisteredCredits = transcripts.reduce((sum, r) => sum + r.credits, 0);
  const totalEarnedCredits = transcripts.filter(r => r.isPassed).reduce((sum, r) => sum + r.credits, 0);
  const totalWeightedSum = transcripts.reduce((sum, r) => sum + r.gradePoint * r.credits, 0);
  const gpa = totalRegisteredCredits === 0 ? "0.00" : (totalWeightedSum / totalRegisteredCredits).toFixed(2);
  
  const getClassification = (gpaValue: number) => {
      if (gpaValue >= 3.6) return "Xuất Sắc";
      if (gpaValue >= 3.2) return "Giỏi";
      if (gpaValue >= 2.5) return "Khá";
      if (gpaValue >= 2.0) return "Trung Bình";
      return "Yếu";
  };

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Bảng Điểm</h2>
          <button onClick={handleDownload} className="btn btn-primary" disabled={loading}>
            <Download size={18} />
            Tải PDF
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải bảng điểm...</p>
          </div>
        ) : (
          <>
            {/* Transcript Info */}
            <div className="transcript-info">
              <div className="info-item">
                <strong>Hệ Thống Đào Tạo:</strong> Tín Chỉ
              </div>
              <div className="info-item">
                <strong>Xếp Loại Hiện Tại:</strong> {getClassification(parseFloat(gpa))}
              </div>
              <div className="info-item">
                <strong>Thang Điểm:</strong> Hệ 4
              </div>
              <div className="info-item">
                <strong>Tổng Tín Chỉ Tích Lũy:</strong> {totalEarnedCredits}
              </div>
            </div>

            {/* Transcripts by Semester */}
            {Object.entries(groupedTranscripts).map(([semester, records]) => {
              const semCredits = records.reduce((sum, r) => sum + r.credits, 0);
              const semWeighted = records.reduce((sum, r) => sum + r.gradePoint * r.credits, 0);
              const semGpa = semCredits === 0 ? "0.00" : (semWeighted / semCredits).toFixed(2);

              return (
                <div key={semester} className="semester-section">
                  <h3 className="semester-title">{semester}</h3>

                  <div className="transcript-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Mã MH</th>
                          <th>Tên Môn Học</th>
                          <th style={{ textAlign: "center" }}>TC</th>
                          <th style={{ textAlign: "center" }}>Điểm Hệ 10</th>
                          <th style={{ textAlign: "center" }}>Điểm Hệ 4</th>
                          <th style={{ textAlign: "center" }}>Điểm Chữ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, index) => (
                          <tr key={index}>
                            <td className="course-code">{record.courseCode}</td>
                            <td className="course-name">{record.subjectName}</td>
                            <td className="credits" style={{ textAlign: "center" }}>{record.credits}</td>
                            <td style={{ textAlign: "center" }}>{record.totalScore.toFixed(1)}</td>
                            <td style={{ textAlign: "center", color: "var(--primary)" }}><strong>{record.gradePoint.toFixed(1)}</strong></td>
                            <td style={{ textAlign: "center" }}>
                              <span 
                                className="grade-badge" 
                                style={{ backgroundColor: record.isPassed ? "#4caf50" : "#f44336" }}
                              >
                                {record.letterGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="semester-summary">
                    <p>
                      <strong>Số Tín Chỉ Đăng Ký Kỳ Này:</strong> {semCredits}
                    </p>
                    <p>
                      <strong>Điểm Trung Bình Học Kỳ (GPA):</strong> <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{semGpa}</span>
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Overall Summary */}
            <div className="overall-summary">
              <h3 className="section-title">Tổng Kết Toàn Khóa</h3>
              <div className="summary-grid">
                <div className="summary-card">
                  <p className="summary-label">Số TC Đã Học</p>
                  <p className="summary-value">{totalRegisteredCredits}</p>
                </div>
                <div className="summary-card">
                  <p className="summary-label">Số TC Tích Lũy</p>
                  <p className="summary-value">{totalEarnedCredits}</p>
                </div>
                <div className="summary-card">
                  <p className="summary-label">GPA Tích Lũy</p>
                  <p className="summary-value">{gpa}</p>
                </div>
                <div className="summary-card">
                  <p className="summary-label">Xếp Loại Tốt Nghiệp</p>
                  <p className="summary-value">{getClassification(parseFloat(gpa))}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentTranscript;
