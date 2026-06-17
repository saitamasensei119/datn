import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { studentAttendanceApi } from "../../services/api";
import { Calendar, AlertTriangle, BookOpen, Clock, XCircle, CheckCircle2 } from "lucide-react";
import "./StudentAttendance.css";

interface CourseSummary {
  courseId: number;
  courseCode: string;
  subjectName: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface AttendanceDetail {
  sessionId: number;
  sessionDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note: string | null;
}

const StudentAttendance: React.FC = () => {
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [details, setDetails] = useState<AttendanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await studentAttendanceApi.getSummary();
      setSummaries(res.data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId: number) => {
    if (selectedCourseId === courseId) {
      // Toggle off
      setSelectedCourseId(null);
      setDetails([]);
      return;
    }
    
    setSelectedCourseId(courseId);
    setDetailsLoading(true);
    try {
      const res = await studentAttendanceApi.getDetails(courseId);
      setDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "var(--success)"; 
      case "ABSENT": return "var(--danger)"; 
      case "LATE": return "var(--warning)"; 
      case "EXCUSED": return "var(--primary)"; 
      default: return "var(--text-muted)";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT": return "Có mặt";
      case "ABSENT": return "Vắng mặt";
      case "LATE": return "Đi muộn";
      case "EXCUSED": return "Có phép";
      default: return "Chưa rõ";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return <CheckCircle2 size={16} color="var(--success)" />;
      case "ABSENT": return <XCircle size={16} color="var(--danger)" />;
      case "LATE": return <Clock size={16} color="var(--warning)" />;
      case "EXCUSED": return <CheckCircle2 size={16} color="var(--primary)" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>Điểm Danh</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Theo dõi chuyên cần của bạn trong học kỳ
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {summaries.length === 0 && !error ? (
          <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <p>Bạn chưa đăng ký môn học nào hoặc chưa có dữ liệu điểm danh.</p>
          </div>
        ) : (
          <div className="attendance-grid">
            {summaries.map(summary => {
              const attendanceRate = summary.totalSessions > 0 
                ? Math.round(((summary.present + summary.late) / summary.totalSessions) * 100) 
                : 100;
              
              const isSelected = selectedCourseId === summary.courseId;

              return (
                <div key={summary.courseId} className={`course-attendance-card ${isSelected ? 'selected' : ''}`}>
                  <div className="card-header" onClick={() => handleSelectCourse(summary.courseId)}>
                    <div className="course-info">
                      <h3 className="course-name">{summary.subjectName}</h3>
                      <span className="course-code">{summary.courseCode}</span>
                    </div>
                    
                    <div className="attendance-stats">
                      <div className="stat-item">
                        <span className="stat-value text-success">{summary.present}</span>
                        <span className="stat-label">Có mặt</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value text-danger">{summary.absent}</span>
                        <span className="stat-label">Vắng</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value text-warning">{summary.late}</span>
                        <span className="stat-label">Muộn</span>
                      </div>
                      
                      <div className="rate-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path className={`circle ${attendanceRate < 80 ? 'danger' : 'success'}`}
                            strokeDasharray={`${attendanceRate}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{attendanceRate}%</text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="card-body">
                      {detailsLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                          <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                        </div>
                      ) : (
                        <div className="details-list">
                          {details.length === 0 ? (
                            <div className="no-details">Chưa có buổi học nào được điểm danh.</div>
                          ) : (
                            details.map(detail => (
                              <div key={detail.sessionId} className="detail-item">
                                <div className="detail-date">
                                  <Calendar size={14} />
                                  <span>{new Date(detail.sessionDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="detail-status" style={{ color: getStatusColor(detail.status) }}>
                                  {getStatusIcon(detail.status)}
                                  <span>{getStatusLabel(detail.status)}</span>
                                </div>
                                {detail.note && (
                                  <div className="detail-note">
                                    <i>({detail.note})</i>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
