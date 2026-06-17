import React, { useState, useEffect } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { courseApi, teacherAttendanceApi } from "../../services/api";
import { Calendar, Users, AlertTriangle } from "lucide-react";
import "./TeacherAttendance.css";

interface Course {
  id: number;
  courseCode: string;
  subjectName: string;
}

interface AttendanceSession {
  id: number;
  courseId: number;
  sessionDate: string;
  note: string;
}

interface AttendanceRecord {
  id: number;
  attendanceSessionId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string;
}

const TeacherAttendance: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await courseApi.getMyCourses();
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách lớp học.");
    }
  };

  const handleLoadSession = async () => {
    if (!selectedCourseId) {
      setError("Vui lòng chọn lớp học.");
      return;
    }
    if (!selectedDate) {
      setError("Vui lòng chọn ngày.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setCurrentSession(null);
    setRecords([]);

    try {
      // 1. Get or create session for the selected date
      const sessionRes = await teacherAttendanceApi.getOrCreateSession(
        Number(selectedCourseId),
        selectedDate
      );
      const session = sessionRes.data;
      setCurrentSession(session);

      // 2. Fetch records for this session
      const recordsRes = await teacherAttendanceApi.getRecords(session.id);
      setRecords(recordsRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể tải danh sách điểm danh.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (recordId: number, newStatus: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, status: newStatus as any } : r
      )
    );
  };

  const handleNoteChange = (recordId: number, note: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, note } : r
      )
    );
  };

  const handleSave = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updatePayload = records.map((r) => ({
        recordId: r.id,
        status: r.status,
        note: r.note,
      }));

      await teacherAttendanceApi.updateRecords(currentSession.id, updatePayload);
      setSuccess("Lưu điểm danh thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm danh.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "#10b981"; // emerald-500
      case "ABSENT": return "#ef4444"; // red-500
      case "LATE": return "#f59e0b"; // amber-500
      case "EXCUSED": return "#3b82f6"; // blue-500
      default: return "#6b7280";
    }
  };

  return (
    <TeacherLayout>
      <div className="page-container">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>Điểm Danh</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Quản lý sĩ số sinh viên từng buổi học
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
            <span>{success}</span>
          </div>
        )}

        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: "250px", flex: 1 }}>
              <label>Lớp học phần</label>
              <select
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              >
                {courses.length === 0 ? (
                  <option value="">-- Chưa có lớp nào --</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.subjectName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Ngày điểm danh</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleLoadSession}
              disabled={loading || !selectedCourseId}
              style={{ padding: "0.6rem 1.2rem", height: "42px" }}
            >
              {loading && !currentSession ? <span className="spinner" style={{ width: "16px", height: "16px", marginRight: "8px", borderWidth: "2px" }} /> : <Users size={18} style={{ marginRight: "8px" }} />}
              Tải danh sách
            </button>
          </div>
        </div>

        {currentSession && (
          <div className="attendance-section glass-card" style={{ padding: "1.5rem" }}>
            <div className="section-header" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "var(--text-primary)" }}>
                  Danh sách sinh viên
                </h3>
                <div style={{ display: "flex", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={14} /> Ngày: {new Date(currentSession.sessionDate).toLocaleDateString('vi-VN')}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Users size={14} /> Sĩ số: {records.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>STT</th>
                    <th style={{ width: "120px" }}>Mã SV</th>
                    <th>Tên Sinh Viên</th>
                    <th style={{ width: "180px" }}>Trạng Thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{index + 1}</td>
                      <td style={{ fontWeight: "500", color: "var(--primary)" }}>{record.studentCode}</td>
                      <td style={{ fontWeight: "500" }}>{record.studentName}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: getStatusColor(record.status),
                            }}
                          ></span>
                          <select
                            value={record.status}
                            onChange={(e) => handleStatusChange(record.id, e.target.value)}
                            className="form-control"
                            style={{ 
                              padding: "0.3rem 0.6rem", 
                              height: "auto", 
                              backgroundColor: "var(--bg-secondary)",
                              borderColor: "transparent",
                              fontWeight: "500",
                              color: getStatusColor(record.status)
                            }}
                          >
                            <option value="PRESENT" style={{ color: "#10b981" }}>Có Mặt</option>
                            <option value="ABSENT" style={{ color: "#ef4444" }}>Vắng Mặt</option>
                            <option value="LATE" style={{ color: "#f59e0b" }}>Đi Muộn</option>
                            <option value="EXCUSED" style={{ color: "#3b82f6" }}>Có Phép</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Thêm ghi chú..."
                          value={record.note || ""}
                          onChange={(e) => handleNoteChange(record.id, e.target.value)}
                          style={{ padding: "0.3rem 0.6rem", height: "auto", backgroundColor: "var(--bg-secondary)", borderColor: "transparent" }}
                        />
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        Không có sinh viên nào trong lớp học phần này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="action-buttons" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={loading || records.length === 0}
                style={{ minWidth: "150px" }}
              >
                {loading ? <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} /> : "Lưu Điểm Danh"}
              </button>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherAttendance;
