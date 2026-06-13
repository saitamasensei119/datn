import React, { useState } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { ClipboardList } from "lucide-react";
import "./TeacherGrades.css";

interface Grade {
  id: number;
  studentCode: string;
  studentName: string;
  midtermScore: number;
  finalScore: number;
  totalScore: number;
}

const TeacherGrades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([
    {
      id: 1,
      studentCode: "SV001",
      studentName: "Nguyễn Văn A",
      midtermScore: 8,
      finalScore: 7.5,
      totalScore: 7.75,
    },
    {
      id: 2,
      studentCode: "SV002",
      studentName: "Trần Thị B",
      midtermScore: 9,
      finalScore: 8.5,
      totalScore: 8.75,
    },
    {
      id: 3,
      studentCode: "SV003",
      studentName: "Lê Văn C",
      midtermScore: 6,
      finalScore: 6.5,
      totalScore: 6.25,
    },
  ]);

  const handleScoreChange = (
    id: number,
    field: "midtermScore" | "finalScore",
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setGrades((prevGrades) =>
      prevGrades.map((grade) => {
        if (grade.id === id) {
          const updated = { ...grade, [field]: numValue };
          updated.totalScore =
            updated.midtermScore * 0.4 + updated.finalScore * 0.6;
          return updated;
        }
        return grade;
      }),
    );
  };

  const handleSave = () => {
    // TODO: Call API to save grades
    alert("Điểm đã được lưu thành công!");
  };

  return (
    <TeacherLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Nhập Điểm</h2>
        </div>

        <div className="grades-section">
          <div className="section-header">
            <h3>Lớp: PTIT - Toán Rời Rạc (CS101)</h3>
          </div>

          <div className="grades-table">
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Tên Sinh Viên</th>
                  <th>Điểm Giữa Kỳ </th>
                  <th>Điểm Cuối Kỳ </th>
                  <th>Điểm Tổng</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.studentCode}</td>
                    <td>{grade.studentName}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={grade.midtermScore}
                        onChange={(e) =>
                          handleScoreChange(
                            grade.id,
                            "midtermScore",
                            e.target.value,
                          )
                        }
                        className="score-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={grade.finalScore}
                        onChange={(e) =>
                          handleScoreChange(
                            grade.id,
                            "finalScore",
                            e.target.value,
                          )
                        }
                        className="score-input"
                      />
                    </td>
                    <td className="total-score">
                      {grade.totalScore.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="action-buttons">
            <button onClick={handleSave} className="btn btn-primary">
              Lưu Điểm
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>

      
    </TeacherLayout>
  );
};

export default TeacherGrades;
