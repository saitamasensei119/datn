import React, { useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { FileText, Download } from "lucide-react";
import "./StudentTranscript.css";

interface TranscriptRecord {
  id: number;
  semester: string;
  year: string;
  courseCode: string;
  courseName: string;
  credits: number;
  grade: string;
  points: number;
  gpa: number;
}

const StudentTranscript: React.FC = () => {
  const [transcripts] = useState<TranscriptRecord[]>([
    {
      id: 1,
      semester: "I",
      year: "2023-2024",
      courseCode: "CS101",
      courseName: "Toán Rời Rạc",
      credits: 3,
      grade: "A",
      points: 4.0,
      gpa: 3.8,
    },
    {
      id: 2,
      semester: "I",
      year: "2023-2024",
      courseCode: "CS102",
      courseName: "Lập Trình C++",
      credits: 4,
      grade: "A",
      points: 4.0,
      gpa: 3.8,
    },
    {
      id: 3,
      semester: "II",
      year: "2023-2024",
      courseCode: "CS103",
      courseName: "Cơ Sở Dữ Liệu",
      credits: 3,
      grade: "B+",
      points: 3.7,
      gpa: 3.75,
    },
  ]);

  const handleDownload = () => {
    alert("Bảng điểm sẽ được tải xuống dưới dạng PDF");
  };

  const groupedTranscripts = transcripts.reduce(
    (acc, record) => {
      const key = `${record.semester}/${record.year}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    },
    {} as Record<string, TranscriptRecord[]>,
  );

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Bảng Điểm</h2>
          <button onClick={handleDownload} className="btn btn-primary">
            <Download size={18} />
            Tải PDF
          </button>
        </div>

        {/* Transcript Info */}
        <div className="transcript-info">
          <div className="info-item">
            <strong>Sinh Viên:</strong> Nguyễn Văn A
          </div>
          <div className="info-item">
            <strong>Mã Sinh Viên:</strong> SV2024001
          </div>
          <div className="info-item">
            <strong>Ngành Học:</strong> Công Nghệ Thông Tin
          </div>
          <div className="info-item">
            <strong>Khoa:</strong> Công Nghệ Thông Tin
          </div>
        </div>

        {/* Transcripts by Semester */}
        {Object.entries(groupedTranscripts).map(([semester, records]) => (
          <div key={semester} className="semester-section">
            <h3 className="semester-title">Học Kỳ {semester}</h3>

            <div className="transcript-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã Lớp</th>
                    <th>Tên Môn Học</th>
                    <th>TC</th>
                    <th>Xếp Loại</th>
                    <th>Điểm</th>
                    <th>GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="course-code">{record.courseCode}</td>
                      <td className="course-name">{record.courseName}</td>
                      <td className="credits">{record.credits}</td>
                      <td>
                        <span className="grade-badge">{record.grade}</span>
                      </td>
                      <td className="points">{record.points.toFixed(1)}</td>
                      <td className="gpa">{record.gpa.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="semester-summary">
              <p>
                <strong>Tổng Tín Chỉ:</strong>{" "}
                {records.reduce((sum, r) => sum + r.credits, 0)}
              </p>
              <p>
                <strong>GPA Học Kỳ:</strong>{" "}
                {(
                  records.reduce((sum, r) => sum + r.gpa, 0) / records.length
                ).toFixed(2)}
              </p>
            </div>
          </div>
        ))}

        {/* Overall Summary */}
        <div className="overall-summary">
          <h3 className="section-title">Tổng Kết Toàn Khóa</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <p className="summary-label">Tổng Tín Chỉ</p>
              <p className="summary-value">
                {transcripts.reduce((sum, r) => sum + r.credits, 0)}
              </p>
            </div>
            <div className="summary-card">
              <p className="summary-label">GPA Toàn Khóa</p>
              <p className="summary-value">
                {(
                  transcripts.reduce((sum, r) => sum + r.gpa, 0) /
                  transcripts.length
                ).toFixed(2)}
              </p>
            </div>
            <div className="summary-card">
              <p className="summary-label">Xếp Loại</p>
              <p className="summary-value">Xuất Sắc</p>
            </div>
            <div className="summary-card">
              <p className="summary-label">Trạng Thái</p>
              <p className="summary-value">Đạt</p>
            </div>
          </div>
        </div>
      </div>

    
    </StudentLayout>
  );
};

export default StudentTranscript;
