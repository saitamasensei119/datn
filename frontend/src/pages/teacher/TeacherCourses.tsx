import React, { useEffect, useState } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { courseApi, teacherGradeApi } from "../../services/api";
import { BookOpen, Users, Edit3, X, Save, Lock } from "lucide-react";
import "./TeacherCourses.css";

interface Course {
  id: number;
  name: string;
  code: string;
  studentCount?: number;
}

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Grade Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [courseGrades, setCourseGrades] = useState<any[]>([]);
  const [midtermSubmitted, setMidtermSubmitted] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  const openStudentModal = async (course: Course) => {
    setSelectedCourseName(course.code + " - " + course.name);
    setIsStudentModalOpen(true);
    setStudentsLoading(true);
    setCourseStudents([]);
    try {
      const response = await courseApi.getStudentsByCourseTeacher(course.id);
      setCourseStudents(response.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách sinh viên.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const openGradeModal = async (course: Course) => {
    setSelectedCourseName(course.code + " - " + course.name);
    setSelectedCourseId(course.id);
    setIsGradeModalOpen(true);
    setGradesLoading(true);
    setCourseGrades([]);
    setMidtermSubmitted(false);
    setFinalSubmitted(false);
    try {
      const [gradesRes, submissionsRes] = await Promise.all([
        teacherGradeApi.getGrades(course.id),
        teacherGradeApi.getSubmissions(course.id),
      ]);
      setCourseGrades(gradesRes.data);
      const submissions = submissionsRes.data;
      const midtermSub = submissions.find((s: any) => s.gradeType === "MIDTERM");
      const finalSub = submissions.find((s: any) => s.gradeType === "FINAL");
      setMidtermSubmitted(midtermSub?.status === "SUBMITTED");
      setFinalSubmitted(finalSub?.status === "SUBMITTED");
    } catch (err) {
      console.error(err);
      alert("Không thể tải dữ liệu điểm.");
    } finally {
      setGradesLoading(false);
    }
  };

  const handleGradeChange = (enrollmentId: number, field: "midtermScore" | "finalScore", value: string) => {
    setCourseGrades((prev) =>
      prev.map((g) => {
        if (g.enrollmentId === enrollmentId) {
          return { ...g, [field]: value === "" ? null : Number(value) };
        }
        return g;
      })
    );
  };

  const handleSaveGrades = async () => {
    if (!selectedCourseId) return;
    setSavingGrades(true);
    try {
      const payload = courseGrades.map((g) => ({
        enrollmentId: g.enrollmentId,
        midtermScore: g.midtermScore,
        finalScore: g.finalScore,
      }));
      await teacherGradeApi.updateGrades(selectedCourseId, payload);
      alert("Lưu điểm thành công!");
      // reload grades to get updated totalScore
      const gradesRes = await teacherGradeApi.getGrades(selectedCourseId);
      setCourseGrades(gradesRes.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Lỗi khi lưu điểm.");
    } finally {
      setSavingGrades(false);
    }
  };

  const handleSubmitGrades = async (type: "midterm" | "final") => {
    if (!selectedCourseId) return;
    if (!window.confirm(`Bạn có chắc muốn chốt điểm ${type === "midterm" ? "giữa kỳ" : "cuối kỳ"} không? Sau khi chốt sẽ không thể sửa.`)) {
      return;
    }
    setSavingGrades(true);
    try {
      // Auto-save before submitting just in case
      const payload = courseGrades.map((g) => ({
        enrollmentId: g.enrollmentId,
        midtermScore: g.midtermScore,
        finalScore: g.finalScore,
      }));
      await teacherGradeApi.updateGrades(selectedCourseId, payload);
      
      if (type === "midterm") {
        await teacherGradeApi.submitMidterm(selectedCourseId);
        setMidtermSubmitted(true);
      } else {
        await teacherGradeApi.submitFinal(selectedCourseId);
        setFinalSubmitted(true);
      }
      alert(`Đã chốt điểm ${type === "midterm" ? "giữa kỳ" : "cuối kỳ"} thành công!`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Lỗi khi chốt điểm.");
    } finally {
      setSavingGrades(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseApi.getMyCourses();
        const mapped = response.data.map((c: any) => ({
          id: c.id,
          name: c.subjectName,
          code: c.courseCode,
          studentCount: c.maxStudents,
        }));

        setCourses(mapped);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu lớp học phần");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <TeacherLayout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="page-container">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="page-header">
          <h2>Lớp Học Phần</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Tìm kiếm lớp..."
              className="search-input"
            />
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} color="var(--text-secondary)" />
            <p>Bạn chưa có lớp học phần nào</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <span className="course-code">{course.code}</span>
                </div>
                <div className="course-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span>{course.studentCount || 0} sinh viên</span>
                  </div>
                </div>
                <div className="course-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => openStudentModal(course)}
                  >
                    Xem Danh Sách SV
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openGradeModal(course)}
                    style={{ marginLeft: '8px' }}
                  >
                    <Edit3 size={16} style={{ marginRight: '4px' }} /> Nhập Điểm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Students Modal */}
        {isStudentModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "600px" }}>
              <div className="modal-header">
                <h3 className="modal-title">Sinh viên lớp: {selectedCourseName}</h3>
                <button className="modal-close" onClick={() => setIsStudentModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {studentsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner"></div>
                  </div>
                ) : courseStudents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    Chưa có sinh viên nào đăng ký lớp này.
                  </div>
                ) : (
                  <table className="custom-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Mã SV</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Họ tên</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Email</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Khoa/Ngành</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", fontWeight: "600", color: "var(--primary)" }}>{student.studentCode}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>{student.fullName}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>{student.email}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>{student.departmentName || "Chưa có"}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor:
                                  student.status === "ACTIVE"
                                    ? "#c8e6c9"
                                    : student.status === "SUSPENDED"
                                      ? "#ffcccc"
                                      : "#e8f5e9",
                                color:
                                  student.status === "ACTIVE"
                                    ? "#2e7d32"
                                    : student.status === "SUSPENDED"
                                      ? "#c62828"
                                      : "#1b5e20",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                              }}
                            >
                              {student.status === "ACTIVE"
                                ? "Đang học"
                                : student.status === "SUSPENDED"
                                  ? "Tạm ngừng"
                                  : student.status === "DROPPED_OUT"
                                    ? "Thôi học"
                                    : "Tốt nghiệp"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setIsStudentModalOpen(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grade Modal */}
        {isGradeModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "800px" }}>
              <div className="modal-header">
                <h3 className="modal-title">Nhập Điểm Lớp: {selectedCourseName}</h3>
                <button className="modal-close" onClick={() => setIsGradeModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {gradesLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner"></div>
                  </div>
                ) : courseGrades.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    Chưa có dữ liệu sinh viên hoặc điểm.
                  </div>
                ) : (
                  <table className="custom-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Mã SV</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>Họ tên</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>Giữa Kỳ</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>Cuối Kỳ</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>Tổng Kết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseGrades.map((grade, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", fontWeight: "600", color: "var(--primary)" }}>{grade.studentCode}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)" }}>{grade.fullName}</td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={grade.midtermScore ?? ""}
                              onChange={(e) => handleGradeChange(grade.enrollmentId, "midtermScore", e.target.value)}
                              disabled={midtermSubmitted || savingGrades}
                              style={{ width: "70px", padding: "4px", textAlign: "center", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: midtermSubmitted ? "#f5f5f5" : "white" }}
                            />
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={grade.finalScore ?? ""}
                              onChange={(e) => handleGradeChange(grade.enrollmentId, "finalScore", e.target.value)}
                              disabled={finalSubmitted || savingGrades}
                              style={{ width: "70px", padding: "4px", textAlign: "center", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: finalSubmitted ? "#f5f5f5" : "white" }}
                            />
                          </td>
                          <td style={{ padding: "10px", borderBottom: "1px solid var(--card-border)", textAlign: "center", fontWeight: "bold" }}>
                            {grade.totalScore !== null ? grade.totalScore : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveGrades}
                    disabled={gradesLoading || savingGrades || (midtermSubmitted && finalSubmitted)}
                  >
                    <Save size={16} style={{ marginRight: '4px' }} /> Lưu Nháp
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSubmitGrades("midterm")}
                    disabled={gradesLoading || savingGrades || midtermSubmitted}
                    style={{ marginRight: '8px' }}
                  >
                    <Lock size={16} style={{ marginRight: '4px' }} /> Chốt Giữa Kỳ
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSubmitGrades("final")}
                    disabled={gradesLoading || savingGrades || finalSubmitted}
                  >
                    <Lock size={16} style={{ marginRight: '4px' }} /> Chốt Cuối Kỳ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherCourses;
