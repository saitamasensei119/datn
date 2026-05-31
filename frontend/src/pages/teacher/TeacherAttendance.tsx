import React, { useState } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { BarChart3 } from "lucide-react";
import "./TeacherAttendance.css";

interface AttendanceRecord {
  id: number;
  date: string;
  studentCode: string;
  studentName: string;
  status: "present" | "absent" | "late";
}

const TeacherAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    {
      id: 1,
      date: "2024-01-15",
      studentCode: "SV001",
      studentName: "Nguyễn Văn A",
      status: "present",
    },
    {
      id: 2,
      date: "2024-01-15",
      studentCode: "SV002",
      studentName: "Trần Thị B",
      status: "present",
    },
    {
      id: 3,
      date: "2024-01-15",
      studentCode: "SV003",
      studentName: "Lê Văn C",
      status: "absent",
    },
  ]);

  const handleStatusChange = (
    id: number,
    newStatus: "present" | "absent" | "late",
  ) => {
    setAttendance((prevRecords) =>
      prevRecords.map((record) =>
        record.id === id ? { ...record, status: newStatus } : record,
      ),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#4caf50";
      case "absent":
        return "#f44336";
      case "late":
        return "#ff9800";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Có Mặt";
      case "absent":
        return "Vắng Mặt";
      case "late":
        return "Đi Muộn";
      default:
        return "Không Xác Định";
    }
  };

  const handleSave = () => {
    // TODO: Call API to save attendance
    alert("Điểm danh đã được lưu thành công!");
  };

  return (
    <TeacherLayout>
      <div className="page-container">
        <div className="page-header">
          <h2>Điểm Danh</h2>
        </div>

        <div className="attendance-section">
          <div className="section-header">
            <h3>Lớp: PTIT - Toán Rời Rạc (CS101)</h3>
            <span className="date-display">Ngày: 15/01/2024</span>
          </div>

          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Tên Sinh Viên</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.studentCode}</td>
                    <td>{record.studentName}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(record.status),
                        }}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>
                      <select
                        value={record.status}
                        onChange={(e) =>
                          handleStatusChange(record.id, e.target.value as any)
                        }
                        className="status-select"
                      >
                        <option value="present">Có Mặt</option>
                        <option value="absent">Vắng Mặt</option>
                        <option value="late">Đi Muộn</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="action-buttons">
            <button onClick={handleSave} className="btn btn-primary">
              Lưu Điểm Danh
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

export default TeacherAttendance;
