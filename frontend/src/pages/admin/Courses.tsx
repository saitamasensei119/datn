import React, { useEffect, useState } from "react";
import {
  courseApi,
  subjectApi,
  lecturerApi,
  semesterApi,
  adminEnrollmentApi,
  adminGradeApi,
} from "../../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Unlock,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

interface Subject {
  id: number;
  name: string;
}

interface Lecturer {
  id: number;
  fullName: string;
}

interface Semester {
  id: number;
  name: string;
}

interface Course {
  id: number;
  courseCode: string;
  maxStudents: number;
  subjectName: string;
  lecturerName: string;
  semesterName: string;
  subjectId?: number;
  lecturerId?: number;
  semesterId?: number;
  attachedCourseCode?: string;
  note?: string;
  status?: string;
  openingBatch?: string;
  midtermWeight?: number;
}

const getStatusBadge = (status: string | undefined) => {
  switch (status) {
    case "OPEN":
      return { bg: "#c8e6c9", color: "#2e7d32", text: "Đang Mở Đăng Kí" };
    case "IN_PROGRESS":
      return { bg: "#fff3e0", color: "#ef6c00", text: "Đang Học" };
    case "COMPLETED":
      return { bg: "#e8eaf6", color: "#283593", text: "Kết Thúc" };
    case "CANCELLED":
      return { bg: "#ffcccc", color: "#c62828", text: "Hủy" };
    case "PLANNED":
    default:
      return { bg: "#e3f2fd", color: "#1565c0", text: "Chuẩn Bị Mở" };
  }
};

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [courseCode, setCourseCode] = useState("");
  const [maxStudents, setMaxStudents] = useState<number>(50);
  const [subjectId, setSubjectId] = useState<string>("");
  const [lecturerId, setLecturerId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>("");
  const [status, setStatus] = useState<string>("PLANNED");
  const [attachedCourseCode, setAttachedCourseCode] = useState("");
  const [note, setNote] = useState("");
  const [openingBatch, setOpeningBatch] = useState("");
  const [midtermWeight, setMidtermWeight] = useState<number>(0.3);

  const [searchCourseCode, setSearchCourseCode] = useState("");

  // Student Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [searchStudentCode, setSearchStudentCode] = useState("");

  // Unlock Modal State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockSubmissions, setUnlockSubmissions] = useState<any[]>([]);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const fetchCourseStudents = async (courseId: number, studentCodeSearch?: string) => {
    setStudentsLoading(true);
    try {
      const response = studentCodeSearch 
        ? await courseApi.searchAdminCourseStudents(courseId, studentCodeSearch)
        : await courseApi.getStudentsByCourseAdmin(courseId);
      setCourseStudents(response.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách sinh viên.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const openStudentModal = async (course: Course) => {
    setSelectedCourseName(course.courseCode + " - " + course.subjectName);
    setSelectedId(course.id);
    setIsStudentModalOpen(true);
    setSearchStudentCode("");
    setCourseStudents([]);
    await fetchCourseStudents(course.id);
  };

  const handleAdminUnenroll = async (studentId: number) => {
    if (!selectedId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp học phần?")) return;
    try {
      await adminEnrollmentApi.unenroll({ studentId, courseId: selectedId });
      setSuccess("Đã xóa sinh viên khỏi lớp học phần.");
      setTimeout(() => setSuccess(""), 3000);
      // reload the students list
      await fetchCourseStudents(selectedId, searchStudentCode);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Không thể xóa sinh viên.");
    }
  };

  const fetchSubmissions = async (courseId: number) => {
    setUnlockLoading(true);
    try {
      const response = await adminGradeApi.getSubmissions(courseId);
      setUnlockSubmissions(response.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải trạng thái chốt điểm.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const openUnlockModal = async (course: Course) => {
    setSelectedCourseName(course.courseCode + " - " + course.subjectName);
    setSelectedId(course.id);
    setIsUnlockModalOpen(true);
    setUnlockSubmissions([]);
    await fetchSubmissions(course.id);
  };

  const handleUnlock = async (type: "midterm" | "final") => {
    if (!selectedId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa điểm ${type === "midterm" ? "giữa kỳ" : "cuối kỳ"} không?`)) return;
    
    try {
      if (type === "midterm") {
        await adminGradeApi.unlockMidterm(selectedId);
      } else {
        await adminGradeApi.unlockFinal(selectedId);
      }
      setSuccess(`Đã mở khóa điểm ${type === "midterm" ? "giữa kỳ" : "cuối kỳ"}.`);
      setTimeout(() => setSuccess(""), 3000);
      await fetchSubmissions(selectedId);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Không thể mở khóa điểm.");
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const res = await courseApi.importExcel(file);
      const data = res.data;
      setSuccess(`Import thành công! Đã tạo ${data.coursesCreated} lớp, ${data.schedulesCreated} lịch học. Lỗi: ${data.errors} dòng.`);
      setTimeout(() => setSuccess(""), 5000);
      fetchData(searchCourseCode);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi khi import file Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fetchData = async (courseCodeSearch?: string) => {
    setLoading(true);
    try {
      const [courseRes, subjRes, lectRes, semRes] = await Promise.all([
        courseCodeSearch ? courseApi.searchAdminCourses(courseCodeSearch) : courseApi.getAll(),
        subjectApi.getAll(),
        lecturerApi.getAll(),
        semesterApi.getAll(),
      ]);

      // Map courses with additional data
      const mappedCourses = courseRes.data.map((course: any) => ({
        id: course.id,
        courseCode: course.courseCode,
        maxStudents: course.maxStudents,
        subjectName: course.subjectName || "Chưa có",
        lecturerName: course.lecturerName || "Chưa có",
        semesterName: course.semesterName || "Chưa có",
        status: course.status || "PLANNED",
        subjectId: course.subjectId,
        lecturerId: course.lecturerId,
        semesterId: course.semesterId,
        attachedCourseCode: course.attachedCourseCode || "",
        note: course.note || "",
        openingBatch: course.openingBatch || "",
        midtermWeight: course.midtermWeight,
      }));

      setCourses(mappedCourses);

      // Map subjects
      const mappedSubjects = subjRes.data.map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
      setSubjects(mappedSubjects);

      // Map lecturers
      const mappedLecturers = lectRes.data.map((l: any) => ({
        id: l.id,
        fullName: l.fullName || l.user?.fullName || "Chưa có tên",
      }));
      setLecturers(mappedLecturers);

      // Map semesters
      const mappedSemesters = semRes.data.map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
      setSemesters(mappedSemesters);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải dữ liệu lớp học phần, môn học hoặc giảng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalType("create");
    setCourseCode("");
    setMaxStudents(50);
    setSubjectId(subjects[0]?.id.toString() || "");
    setLecturerId(lecturers[0]?.id.toString() || "");
    setSemesterId(semesters[0]?.id.toString() || "");
    setStatus("PLANNED");
    setAttachedCourseCode("");
    setNote("");
    setOpeningBatch("");
    setMidtermWeight(0.3);
    setSelectedId(null);
    setIsModalOpen(true);
    setError("");
  };

  const openEditModal = (course: Course) => {
    setModalType("edit");
    setCourseCode(course.courseCode);
    setMaxStudents(course.maxStudents);
    setSubjectId(course.subjectId?.toString() || "");
    setLecturerId(course.lecturerId?.toString() || "");
    setSemesterId(course.semesterId?.toString() || "");
    setStatus(course.status || "PLANNED");
    setAttachedCourseCode(course.attachedCourseCode || "");
    setNote(course.note || "");
    setOpeningBatch(course.openingBatch || "");
    setMidtermWeight(course.midtermWeight ?? 0.3);
    setSelectedId(course.id);
    setIsModalOpen(true);
    setError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !courseCode.trim() ||
      !subjectId ||
      !lecturerId ||
      !semesterId ||
      maxStudents < 1 ||
      !openingBatch.trim() ||
      !attachedCourseCode.trim() ||
      !note.trim()
    ) {
      setError(
        "Vui lòng điền đầy đủ các thông tin bắt buộc và số học sinh > 0.",
      );
      return;
    }

    const payload = {
      courseCode,
      subjectId: Number(subjectId),
      lecturerId: Number(lecturerId),
      semesterId: Number(semesterId),
      maxStudents: Number(maxStudents),
      status,
      attachedCourseCode,
      note,
      openingBatch,
      midtermWeight: Number(midtermWeight),
    };

    try {
      if (modalType === "create") {
        await courseApi.create(payload);
        setSuccess("Tạo lớp học phần mới thành công!");
      } else if (modalType === "edit" && selectedId !== null) {
        await courseApi.update(selectedId, payload);
        setSuccess("Cập nhật lớp học phần thành công!");
      }
      setIsModalOpen(false);
      fetchData(searchCourseCode);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu lớp học phần.",
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa lớp học phần này? Đăng ký học phần của sinh viên sẽ bị ảnh hưởng.",
      )
    ) {
      return;
    }

    setError("");
    try {
      await courseApi.delete(id);
      setSuccess("Xóa lớp học phần thành công!");
      fetchData(searchCourseCode);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Không thể xóa lớp học phần này.",
      );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="glass-card">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>
              Quản Lý Lớp Học Phần
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              Tạo, chỉnh sửa và xóa lớp học phần
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImportExcel}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isImporting}
            >
              <BookOpen size={18} />
              <span>{isImporting ? 'Đang Import...' : 'Import Excel'}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              disabled={loading}
            >
              <Plus size={18} />
              <span>Tạo lớp học phần</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Courses */}
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "10px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo mã lớp học phần..."
            value={searchCourseCode}
            onChange={(e) => setSearchCourseCode(e.target.value)}
            style={{ maxWidth: "300px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchData(searchCourseCode);
            }}
          />
          <button className="btn btn-secondary" onClick={() => fetchData(searchCourseCode)}>
            Tìm kiếm
          </button>
          {searchCourseCode && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchCourseCode("");
                fetchData("");
              }}
            >
              Hủy tìm
            </button>
          )}
        </div>

        {success && (
          <div className="alert alert-success" style={{ margin: "1rem 0" }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ margin: "1rem 0" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: "center",
              padding: "3rem",
              marginTop: "2rem",
            }}
          >
            <BookOpen
              size={48}
              style={{ margin: "0 auto 1rem", color: "var(--text-secondary)" }}
            />
            <p style={{ color: "var(--text-secondary)" }}>
              Chưa có lớp học phần nào
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: "2rem" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "100px" }}>Mã Lớp</th>
                  <th>Môn Học</th>
                  <th>Giảng Viên</th>
                  <th>Học Kỳ</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Đợt mở</th>
                  <th>Mã lớp kèm</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Sĩ Số</th>
                  <th style={{ width: "100px", textAlign: "center" }}>
                    Trạng Thái
                  </th>
                  <th style={{ width: "150px", textAlign: "center" }}>
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                      {course.courseCode}
                    </td>
                    <td>{course.subjectName}</td>
                     <td>{course.lecturerName}</td>
                    <td>{course.semesterName}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-secondary" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid var(--card-border)" }}>
                        {course.openingBatch || "Chưa có"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{course.attachedCourseCode || "Không"}</td>
                    <td style={{ textAlign: "center" }}>
                      {course.maxStudents}
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.9rem" }}>
                      {(() => {
                        const badge = getStatusBadge(course.status);
                        return (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              backgroundColor: badge.bg,
                              color: badge.color,
                              fontWeight: "500",
                            }}
                          >
                            {badge.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-icon-only"
                        onClick={() => openStudentModal(course)}
                        title="Danh sách sinh viên"
                        style={{ marginRight: "4px" }}
                      >
                        <BookOpen size={16} />
                      </button>
                      <button
                        className="btn-icon-only"
                        onClick={() => openEditModal(course)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon-only"
                        onClick={() => openUnlockModal(course)}
                        title="Mở khóa điểm"
                        style={{ marginLeft: "4px", color: "var(--warning)" }}
                      >
                        <Unlock size={16} />
                      </button>
                      <button
                        className="btn-icon-only delete"
                        onClick={() => handleDelete(course.id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
                <h3 className="modal-title">
                  {modalType === "create"
                    ? "Tạo lớp học phần mới"
                    : "Cập nhật lớp học phần"}
                </h3>
                <button className="modal-close" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ margin: "1rem" }}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-body">
                  {error && (
                    <div
                      className="alert alert-danger"
                      style={{ marginBottom: "1rem" }}
                    >
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">
                      Mã Lớp Học Phần{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="Ví dụ: KTPM01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Môn Học <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn môn học --</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Giảng Viên{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={lecturerId}
                      onChange={(e) => setLecturerId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Học Kỳ <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={semesterId}
                      onChange={(e) => setSemesterId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn học kỳ --</option>
                      {semesters.map((semester) => (
                        <option key={semester.id} value={semester.id}>
                          {semester.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Tỷ Trọng Điểm Giữa Kỳ{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="form-control"
                      value={midtermWeight}
                      onChange={(e) => setMidtermWeight(Number(e.target.value))}
                      required
                    />
                    <small style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>
                      Ví dụ: 0.3 (tương đương 30%)
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Sĩ Số Tối Đa{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={maxStudents}
                      onChange={(e) => setMaxStudents(Number(e.target.value))}
                      min="1"
                      max="999"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Đợt mở lớp (Opening Batch){" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={openingBatch}
                      onChange={(e) => setOpeningBatch(e.target.value)}
                      placeholder="Ví dụ: AB"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Mã lớp kèm <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={attachedCourseCode}
                      onChange={(e) => setAttachedCourseCode(e.target.value)}
                      placeholder="Ví dụ: 123456"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Ghi chú <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <textarea
                      className="form-control"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nhập ghi chú (nếu có)..."
                      required
                      style={{ minHeight: "80px", resize: "vertical" }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Trạng Thái{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                    >
                      <option value="PLANNED">Chuẩn Bị Mở</option>
                      <option value="OPEN">Đang Mở Đăng Kí</option>
                      <option value="IN_PROGRESS">Đang Học</option>
                      <option value="COMPLETED">Kết Thúc</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === "create" ? "Tạo" : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Students Modal */}
        {isStudentModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "800px" }}>
              <div className="modal-header" style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <h3 className="modal-title">Sinh viên trong lớp: {selectedCourseName}</h3>
                  <button className="modal-close" onClick={() => setIsStudentModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                
                {/* Search Bar for Students in Course */}
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm theo mã sinh viên..."
                    value={searchStudentCode}
                    onChange={(e) => setSearchStudentCode(e.target.value)}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedId) fetchCourseStudents(selectedId, searchStudentCode);
                    }}
                  />
                  <button className="btn btn-primary" onClick={() => selectedId && fetchCourseStudents(selectedId, searchStudentCode)}>
                    Tìm kiếm
                  </button>
                  {searchStudentCode && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearchStudentCode("");
                        if (selectedId) fetchCourseStudents(selectedId, "");
                      }}
                    >
                      Hủy tìm
                    </button>
                  )}
                </div>
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
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Khoa/Ngành</th>
                        <th style={{ textAlign: "center" }}>Trạng thái</th>
                        <th style={{ textAlign: "center", width: "100px" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "600", color: "var(--primary)" }}>{student.studentCode}</td>
                          <td>{student.fullName}</td>
                          <td>{student.email}</td>
                          <td>{student.departmentName || "Chưa có"}</td>
                          <td style={{ textAlign: "center" }}>
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
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon-only delete"
                              title="Hủy đăng ký (Xóa khỏi lớp)"
                              onClick={() => handleAdminUnenroll(student.id)}
                            >
                              <Trash2 size={16} />
                            </button>
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

        {/* Unlock Grades Modal */}
        {isUnlockModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "500px" }}>
              <div className="modal-header">
                <h3 className="modal-title">Trạng Thái Điểm: {selectedCourseName}</h3>
                <button className="modal-close" onClick={() => setIsUnlockModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {unlockLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner"></div>
                  </div>
                ) : unlockSubmissions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    Chưa có thông tin điểm.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {(() => {
                      const midtermSub = unlockSubmissions.find((s: any) => s.gradeType === "MIDTERM");
                      const finalSub = unlockSubmissions.find((s: any) => s.gradeType === "FINAL");
                      return (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-light)", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                            <div>
                              <strong>Điểm Giữa Kỳ:</strong>{" "}
                              <span style={{ color: midtermSub?.status === "SUBMITTED" ? "var(--danger)" : "var(--success)" }}>
                                {midtermSub?.status === "SUBMITTED" ? "Đã chốt" : "Chưa chốt"}
                              </span>
                            </div>
                            {midtermSub?.status === "SUBMITTED" && (
                              <button className="btn btn-sm btn-primary" onClick={() => handleUnlock("midterm")}>
                                Mở khóa
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-light)", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                            <div>
                              <strong>Điểm Cuối Kỳ:</strong>{" "}
                              <span style={{ color: finalSub?.status === "SUBMITTED" ? "var(--danger)" : "var(--success)" }}>
                                {finalSub?.status === "SUBMITTED" ? "Đã chốt" : "Chưa chốt"}
                              </span>
                            </div>
                            {finalSub?.status === "SUBMITTED" && (
                              <button className="btn btn-sm btn-primary" onClick={() => handleUnlock("final")}>
                                Mở khóa
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default Courses;
