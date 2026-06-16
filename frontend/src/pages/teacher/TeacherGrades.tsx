import React, { useState, useEffect } from "react";
import TeacherLayout from "../../components/TeacherLayout";
import { teacherGradeApi, courseApi } from "../../services/api";
import { ClipboardList, Save, Lock, CheckCircle } from "lucide-react";
import "./TeacherGrades.css";

interface Course {
  id: number;
  subjectName: string;
  courseCode: string;
}

interface Grade {
  enrollmentId: number;
  studentCode: string;
  fullName: string;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
}

interface Submission {
  gradeType: "MIDTERM" | "FINAL";
  status: "NOT_SUBMITTED" | "SUBMITTED";
}

const TeacherGrades: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">(() => {
    const saved = sessionStorage.getItem("teacher_selected_course_id");
    return saved ? Number(saved) : "";
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchCourseCode, setSearchCourseCode] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchGradesData(Number(selectedCourseId));
    } else {
      setGrades([]);
      setSubmissions([]);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const res = await courseApi.getMyCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách lớp học phần.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchGradesData = async (courseId: number) => {
    setLoadingGrades(true);
    try {
      const [gradesRes, subsRes] = await Promise.all([
        teacherGradeApi.getGrades(courseId),
        teacherGradeApi.getSubmissions(courseId),
      ]);
      setGrades(gradesRes.data || []);
      setSubmissions(subsRes.data || []);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      alert("Không thể tải dữ liệu điểm.");
    } finally {
      setLoadingGrades(false);
    }
  };

  const getSubmissionStatus = (type: "MIDTERM" | "FINAL") => {
    return submissions.find((s) => s.gradeType === type)?.status || "NOT_SUBMITTED";
  };

  const isMidtermLocked = getSubmissionStatus("MIDTERM") === "SUBMITTED";
  const isFinalLocked = getSubmissionStatus("FINAL") === "SUBMITTED";

  const handleScoreChange = (
    enrollmentId: number,
    field: "midtermScore" | "finalScore",
    value: string,
  ) => {
    const numValue = value === "" ? null : parseFloat(value);
    
    // Validate range if it's a number
    if (numValue !== null && (numValue < 0 || numValue > 10)) {
        return; // Prevent typing invalid scores
    }

    setGrades((prevGrades) =>
      prevGrades.map((grade) => {
        if (grade.enrollmentId === enrollmentId) {
          return { ...grade, [field]: numValue };
        }
        return grade;
      }),
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedCourseId) return;
    setSaving(true);
    try {
      // Filter out only what we need
      const dataToSave = grades.map(g => ({
        enrollmentId: g.enrollmentId,
        midtermScore: g.midtermScore,
        finalScore: g.finalScore
      }));
      await teacherGradeApi.updateGrades(Number(selectedCourseId), dataToSave);
      alert("Đã lưu điểm thành công!");
      setHasUnsavedChanges(false);
      fetchGradesData(Number(selectedCourseId)); // Refresh to get calculated total scores
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (type: "MIDTERM" | "FINAL") => {
    if (!selectedCourseId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn chốt điểm ${type === "MIDTERM" ? "Giữa Kỳ" : "Cuối Kỳ"}? Sau khi chốt, bạn sẽ KHÔNG THỂ SỬA ĐIỂM được nữa.`)) {
      return;
    }

    setSaving(true);
    try {
      // Recommend saving first before submitting to ensure latest changes are locked
      await handleSave(); 

      if (type === "MIDTERM") {
        await teacherGradeApi.submitMidterm(Number(selectedCourseId));
      } else {
        await teacherGradeApi.submitFinal(Number(selectedCourseId));
      }
      alert(`Đã chốt điểm ${type === "MIDTERM" ? "Giữa Kỳ" : "Cuối Kỳ"} thành công!`);
      fetchGradesData(Number(selectedCourseId));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi chốt điểm.");
    } finally {
      setSaving(false);
    }
  };

  const selectedCourseName = courses.find((c) => c.id === Number(selectedCourseId))?.subjectName || "";
  const selectedCourseCode = courses.find((c) => c.id === Number(selectedCourseId))?.courseCode || "";

  const handleCourseSelection = async (newCourseId: number | "") => {
    if (newCourseId === selectedCourseId) return;
    if (hasUnsavedChanges) {
      const wantToSave = window.confirm("Bạn có điểm chưa lưu. Bạn có muốn lưu lại trước khi chuyển sang lớp khác không?");
      if (wantToSave) {
        await handleSave();
      }
    }
    setSelectedCourseId(newCourseId);
    if (newCourseId) {
      sessionStorage.setItem("teacher_selected_course_id", newCourseId.toString());
    } else {
      sessionStorage.removeItem("teacher_selected_course_id");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const filtered = courses.filter(course => (course.courseCode || "").toLowerCase().includes(searchCourseCode.toLowerCase()));
      if (filtered.length > 0) {
        handleCourseSelection(filtered[0].id);
      } else {
        alert("Không tìm thấy lớp học phần nào phù hợp với từ khóa này.");
      }
    }
  };

  return (
    <TeacherLayout>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Quản Lý Điểm Số</h2>
          <div className="course-selector" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Tìm theo mã lớp ..." 
              value={searchCourseCode}
              onChange={(e) => setSearchCourseCode(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="form-control"
              style={{ width: '180px' }}
            />
            <label style={{ fontWeight: '500' }}>Chọn Lớp Học Phần:</label>
            <select 
              value={selectedCourseId} 
              onChange={(e) => handleCourseSelection(e.target.value ? Number(e.target.value) : "")}
              className="form-control"
              style={{ minWidth: '250px' }}
              disabled={loadingCourses}
            >
              <option value="">-- Chọn lớp học phần --</option>
              {courses
                .filter(course => (course.courseCode || "").toLowerCase().includes(searchCourseCode.toLowerCase()))
                .map(course => (
                <option key={course.id} value={course.id}>{course.courseCode} - {course.subjectName}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCourseId ? (
          <div className="grades-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={20} />
                  {selectedCourseCode} - {selectedCourseName}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Sĩ số: {grades.length} sinh viên
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Điểm Giữa Kỳ:</span>
                  {isMidtermLocked ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <Lock size={14} /> Đã Chốt
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                       Đang Mở
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Điểm Cuối Kỳ:</span>
                  {isFinalLocked ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <Lock size={14} /> Đã Chốt
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                       Đang Mở
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loadingGrades ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="grades-table" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card-bg)' }}>
                      <tr>
                        <th>Mã SV</th>
                        <th>Tên Sinh Viên</th>
                        <th style={{ textAlign: "center" }}>Điểm Giữa Kỳ</th>
                        <th style={{ textAlign: "center" }}>Điểm Cuối Kỳ</th>
                        <th style={{ textAlign: "center" }}>Điểm Tổng (Tham khảo)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                            Lớp học phần này chưa có sinh viên đăng ký.
                          </td>
                        </tr>
                      ) : (
                        grades.map((grade) => (
                          <tr key={grade.enrollmentId}>
                            <td style={{ fontWeight: '500' }}>{grade.studentCode}</td>
                            <td>{grade.fullName}</td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={grade.midtermScore !== null ? grade.midtermScore : ""}
                                onChange={(e) => handleScoreChange(grade.enrollmentId, "midtermScore", e.target.value)}
                                className={`score-input ${isMidtermLocked ? 'locked' : ''}`}
                                disabled={isMidtermLocked || saving}
                                style={{ width: '80px', textAlign: 'center', backgroundColor: isMidtermLocked ? '#f5f5f5' : 'white' }}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={grade.finalScore !== null ? grade.finalScore : ""}
                                onChange={(e) => handleScoreChange(grade.enrollmentId, "finalScore", e.target.value)}
                                className={`score-input ${isFinalLocked ? 'locked' : ''}`}
                                disabled={isFinalLocked || saving}
                                style={{ width: '80px', textAlign: 'center', backgroundColor: isFinalLocked ? '#f5f5f5' : 'white' }}
                              />
                            </td>
                            <td className="total-score" style={{ textAlign: "center", fontWeight: "bold", color: "var(--primary)" }}>
                              {grade.totalScore !== null ? grade.totalScore.toFixed(2) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                  <button 
                    onClick={handleSave} 
                    className="btn btn-secondary"
                    disabled={saving || (isMidtermLocked && isFinalLocked)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={18} /> Lưu Nháp
                  </button>

                  <button 
                    onClick={() => handleSubmit("MIDTERM")} 
                    className="btn btn-primary"
                    disabled={saving || isMidtermLocked}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isMidtermLocked ? 'var(--text-secondary)' : '#f57c00' }}
                  >
                    <CheckCircle size={18} /> Chốt Giữa Kỳ
                  </button>

                  <button 
                    onClick={() => handleSubmit("FINAL")} 
                    className="btn btn-primary"
                    disabled={saving || isFinalLocked}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isFinalLocked ? 'var(--text-secondary)' : 'var(--danger)' }}
                  >
                    <CheckCircle size={18} /> Chốt Cuối Kỳ
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--card-bg)', borderRadius: '12px', marginTop: '2rem' }}>
            <ClipboardList size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chưa chọn lớp học phần</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Vui lòng chọn một lớp học phần ở thanh phía trên để tiến hành nhập điểm.</p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherGrades;
