import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { courseApi, studentGradeApi, studentAttendanceApi } from "../../services/api";
import { 
  ArrowLeft, 
  BookOpen, 
  User, 
  Clock, 
  Target, 
  CalendarDays,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import "./StudentCourseDetails.css";

interface CourseDetail {
  id: number;
  courseCode: string;
  subjectName: string;
  maxStudents: number;
  lecturerName: string;
  status: string;
  weekPattern: string;
  openingBatch: string;
  midtermWeight?: number;
}

interface GradeDetail {
  courseId: number;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
}

interface AttendanceDetail {
  sessionId: number;
  sessionDate: string;
  status: string;
  note: string | null;
}

const StudentCourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [grade, setGrade] = useState<GradeDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceDetail[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchData(Number(id));
    }
  }, [id]);

  const fetchData = async (courseId: number) => {
    setLoading(true);
    try {
      // Fetch 3 things in parallel
      const [courseRes, gradeRes, attendanceRes] = await Promise.all([
        courseApi.getStudentCourseById(courseId),
        studentGradeApi.getMyGrades(),
        studentAttendanceApi.getDetails(courseId).catch(() => ({ data: [] }))
      ]);

      setCourse(courseRes.data);
      
      // Find grade for this specific course
      const myGrades: any[] = gradeRes.data;
      const specificGrade = myGrades.find(g => g.courseId === courseId);
      if (specificGrade) {
        setGrade(specificGrade);
      }
      
      // Set attendance
      setAttendance(attendanceRes.data);

    } catch (err: any) {
      console.error(err);
      setError("Không thể tải dữ liệu lớp học phần. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNED": return "var(--info)";
      case "OPEN": return "var(--success)";
      case "IN_PROGRESS": return "var(--warning)";
      case "COMPLETED": return "var(--primary)";
      case "CANCELLED": return "var(--danger)";
      default: return "var(--text-muted)";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PLANNED": return "Dự Kiến";
      case "OPEN": return "Mở Đăng Ký";
      case "IN_PROGRESS": return "Đang Học";
      case "COMPLETED": return "Đã Kết Thúc";
      case "CANCELLED": return "Đã Hủy";
      default: return status;
    }
  };

  const getAttStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return <CheckCircle2 size={16} color="var(--success)" />;
      case "ABSENT": return <XCircle size={16} color="var(--danger)" />;
      case "LATE": return <Clock size={16} color="var(--warning)" />;
      case "EXCUSED": return <CheckCircle2 size={16} color="var(--primary)" />;
      default: return <AlertCircle size={16} color="var(--text-muted)" />;
    }
  };

  const getAttStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT": return "Có mặt";
      case "ABSENT": return "Vắng mặt";
      case "LATE": return "Đi muộn";
      case "EXCUSED": return "Có phép";
      default: return "Chưa rõ";
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

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="page-container">
          <div className="alert alert-danger">{error || "Không tìm thấy lớp học phần."}</div>
          <button className="btn btn-secondary" onClick={() => navigate('/student/my-courses')}>
            Quay lại
          </button>
        </div>
      </StudentLayout>
    );
  }

  // Calculate attendance summary
  const presentCount = attendance.filter(a => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const totalSessions = attendance.length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

  return (
    <StudentLayout>
      <div className="page-container course-details-page">
        <button className="btn btn-back" onClick={() => navigate('/student/my-courses')}>
          <ArrowLeft size={18} /> Quay Lại
        </button>

        <div className="details-header">
          <div className="header-title-section">
            <h2 className="page-title">{course.subjectName}</h2>
            <div className="badges">
              <span className="badge code-badge">{course.courseCode}</span>
              <span className="badge status-badge" style={{ backgroundColor: getStatusColor(course.status) }}>
                {getStatusLabel(course.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="details-grid">
          {/* Cột trái: Thông tin chung & Trọng số */}
          <div className="details-left">
            <div className="glass-card info-card">
              <h3><BookOpen size={20} /> Thông Tin Chung</h3>
              <ul className="info-list">
                <li>
                  <User size={18} />
                  <span><strong>Giảng viên:</strong> {course.lecturerName || "Chưa phân công"}</span>
                </li>
                <li>
                  <CalendarDays size={18} />
                  <span><strong>Lịch học:</strong> {course.weekPattern || "Chưa có"}</span>
                </li>
                <li>
                  <Target size={18} />
                  <span><strong>Đợt mở:</strong> {course.openingBatch}</span>
                </li>
              </ul>
            </div>

            <div className="glass-card weight-card">
              <h3><Percent size={20} /> Trọng Số Điểm</h3>
              {course.midtermWeight != null ? (
                <div className="weight-bars">
                  <div className="weight-item">
                    <div className="weight-label">Giữa kỳ ({Math.round(course.midtermWeight * 100)}%)</div>
                    <div className="progress-bar-container">
                      <div className="progress-bar midterm-bar" style={{ width: `${Math.round(course.midtermWeight * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="weight-item">
                    <div className="weight-label">Cuối kỳ ({Math.round((1 - course.midtermWeight) * 100)}%)</div>
                    <div className="progress-bar-container">
                      <div className="progress-bar final-bar" style={{ width: `${Math.round((1 - course.midtermWeight) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted">Môn học này chưa cài đặt trọng số điểm.</p>
              )}
            </div>
          </div>

          {/* Cột phải: Điểm số & Chuyên cần */}
          <div className="details-right">
            <div className="glass-card grades-card">
              <h3><Target size={20} /> Kết Quả Học Tập Của Bạn</h3>
              <div className="grades-grid">
                <div className="grade-box">
                  <span className="grade-title">Giữa Kỳ</span>
                  <span className={`grade-value ${grade?.midtermScore == null ? 'empty' : ''}`}>
                    {grade?.midtermScore != null ? grade.midtermScore.toFixed(2) : '-'}
                  </span>
                </div>
                <div className="grade-box">
                  <span className="grade-title">Cuối Kỳ</span>
                  <span className={`grade-value ${grade?.finalScore == null ? 'empty' : ''}`}>
                    {grade?.finalScore != null ? grade.finalScore.toFixed(2) : '-'}
                  </span>
                </div>
                <div className="grade-box total">
                  <span className="grade-title">Tổng Kết</span>
                  <span className={`grade-value ${grade?.totalScore == null ? 'empty' : ''}`}>
                    {grade?.totalScore != null ? grade.totalScore.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card attendance-card">
              <div className="attendance-header">
                <h3><Clock size={20} /> Tình Trạng Chuyên Cần</h3>
                {totalSessions > 0 && (
                  <span className={`rate-badge ${attendanceRate >= 80 ? 'good' : 'bad'}`}>
                    {attendanceRate}%
                  </span>
                )}
              </div>
              
              {totalSessions === 0 ? (
                <p className="text-muted">Lớp học này chưa có dữ liệu điểm danh.</p>
              ) : (
                <>
                  <div className="attendance-summary-mini">
                    <span><CheckCircle2 size={14} color="var(--success)"/> {presentCount}</span>
                    <span><Clock size={14} color="var(--warning)"/> {lateCount}</span>
                    <span><XCircle size={14} color="var(--danger)"/> {absentCount}</span>
                  </div>
                  
                  <div className="attendance-history">
                    {attendance.map((session, idx) => (
                      <div key={session.sessionId} className="att-row">
                        <span className="att-idx">#{totalSessions - idx}</span>
                        <span className="att-date">{new Date(session.sessionDate).toLocaleDateString('vi-VN')}</span>
                        <span className="att-status">
                          {getAttStatusIcon(session.status)}
                          <span>{getAttStatusLabel(session.status)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentCourseDetails;
