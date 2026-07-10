import React, { useEffect, useState } from "react";
import {
  courseApi,
  subjectApi,
  lecturerApi,
  semesterApi,
  adminEnrollmentApi,
  adminGradeApi,
  timetableApi,
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
  Calendar,
  Zap,
  Download,
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

interface ClassSchedule {
  id: number;
  sessionNumber: number;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  shift?: string;
  timeString?: string;
  roomName?: string;
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
  schedules?: ClassSchedule[];
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
  const [_subjects, _setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, _setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterSemesterId, setFilterSemesterId] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Action Modal State (Generate Courses, Schedule Timetable, Export Excel)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "generate" | "schedule" | "export" | null;
    semesterId: string;
  }>({
    isOpen: false,
    type: null,
    semesterId: "",
  });

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

  // Subject Autocomplete State
  const [subjectSearchText, setSubjectSearchText] = useState("");
  const [subjectSuggestions, setSubjectSuggestions] = useState<any[]>([]);
  const [isSearchingSubject, setIsSearchingSubject] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!showSuggestions || !isModalOpen) return;
    const timer = setTimeout(async () => {
      setIsSearchingSubject(true);
      try {
        const res = await subjectApi.searchSimple(subjectSearchText, 15);
        setSubjectSuggestions(res.data || []);
      } catch (err) {
        console.error("Error searching subjects:", err);
      } finally {
        setIsSearchingSubject(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [subjectSearchText, showSuggestions, isModalOpen]);

  const fetchLecturers = async () => {
    if (lecturers.length > 0) return;
    try {
      const lectRes = await lecturerApi.getAll();
      const mappedLecturers = lectRes.data.map((l: any) => ({
        id: l.id,
        fullName: l.fullName || l.user?.fullName || "Chưa có tên",
      }));
      setLecturers(mappedLecturers);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
    }
  };

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

  const openActionModal = (type: "generate" | "schedule" | "export") => {
    if (semesters.length === 0) {
      setError("Chưa có học kỳ nào trong hệ thống.");
      return;
    }
    setActionModal({
      isOpen: true,
      type,
      semesterId: semesters[0]?.id.toString() || "",
    });
  };

  const confirmActionModal = async () => {
    const targetSemesterId = Number(actionModal.semesterId);
    if (!targetSemesterId) return;

    const currentType = actionModal.type;
    setActionModal({ ...actionModal, isOpen: false });

    if (currentType === "generate") {
      setIsGenerating(true);
      setError("");
      setSuccess("");
      try {
        const res = await timetableApi.generateCourses(targetSemesterId);
        setSuccess(`${res.data.message} (Đã tạo: ${res.data.coursesGenerated} lớp)`);
        setTimeout(() => setSuccess(""), 5000);
        fetchData(searchCourseCode);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Lỗi khi tự động sinh lớp học phần.");
      } finally {
        setIsGenerating(false);
      }
    } else if (currentType === "schedule") {
      setIsScheduling(true);
      setError("");
      setSuccess("");
      try {
        const res = await timetableApi.scheduleCourses(targetSemesterId);
        const timeStr = res.data.executionTimeSeconds ? ` | Thời gian giải: ${res.data.executionTimeSeconds}s` : "";
        setSuccess(`${res.data.message} (Đã xếp: ${res.data.schedulesCreated} lịch học${timeStr})`);
        setTimeout(() => setSuccess(""), 5000);
        fetchData(searchCourseCode);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Lỗi khi tự động xếp thời khóa biểu.");
      } finally {
        setIsScheduling(false);
      }
    } else if (currentType === "export") {
      setIsExporting(true);
      setError("");
      setSuccess("");
      try {
        const res = await timetableApi.exportExcel(targetSemesterId);
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ThoiKhoaBieu_HocKy_${targetSemesterId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setSuccess("Xuất file Excel Thời Khóa Biểu thành công!");
        setTimeout(() => setSuccess(""), 4000);
      } catch (err: any) {
        console.error(err);
        setError("Lỗi khi tải xuống file Excel.");
      } finally {
        setIsExporting(false);
      }
    }
  };

  const fetchData = async (courseCodeSearch?: string, semId?: string) => {
    setLoading(true);
    try {
      const targetSemId = semId !== undefined ? semId : filterSemesterId;
      const [courseRes, semRes] = await Promise.all([
        courseApi.getPaginated(
          currentPage,
          pageSize,
          courseCodeSearch !== undefined ? courseCodeSearch : searchCourseCode,
          targetSemId ? Number(targetSemId) : undefined
        ),
        semesterApi.getAll(),
      ]);

      const rawCourses = courseRes.data.content || courseRes.data;
      if (courseRes.data.totalPages !== undefined) {
        setTotalPages(courseRes.data.totalPages);
        setTotalElements(courseRes.data.totalElements);
      }

      // Map courses with additional data
      const mappedCourses = rawCourses.map((course: any) => ({
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
        schedules: course.schedules || [],
      }));

      setCourses(mappedCourses);

      // Map semesters
      const mappedSemesters = semRes.data.map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
      setSemesters(mappedSemesters);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải dữ liệu lớp học phần hoặc học kỳ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(searchCourseCode, filterSemesterId);
  }, [currentPage, pageSize]);

  const openCreateModal = () => {
    setModalType("create");
    setCourseCode("");
    setMaxStudents(50);
    setSubjectId("");
    setSubjectSearchText("");
    setSubjectSuggestions([]);
    setShowSuggestions(false);
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
    fetchLecturers();
  };

  const openEditModal = (course: Course) => {
    setModalType("edit");
    setCourseCode(course.courseCode);
    setMaxStudents(course.maxStudents);
    setSubjectId(course.subjectId?.toString() || "");
    setSubjectSearchText(course.subjectName || "");
    setSubjectSuggestions([]);
    setShowSuggestions(false);
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
    fetchLecturers();
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
              disabled={loading || isImporting || isGenerating || isScheduling}
            >
              <BookOpen size={18} />
              <span>{isImporting ? 'Đang Import...' : 'Import Excel'}</span>
            </button>
            <button
              className="btn"
              style={{ backgroundColor: "#10b981", color: "white", display: "flex", alignItems: "center", gap: "6px", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}
              onClick={() => openActionModal("generate")}
              disabled={loading || isGenerating || isScheduling}
            >
              <Zap size={18} />
              <span>{isGenerating ? 'Đang sinh lớp...' : 'Sinh lớp từ nguyện vọng'}</span>
            </button>
            <button
              className="btn"
              style={{ backgroundColor: "#6366f1", color: "white", display: "flex", alignItems: "center", gap: "6px", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}
              onClick={() => openActionModal("schedule")}
              disabled={loading || isGenerating || isScheduling || isExporting}
            >
              <Calendar size={18} />
              <span>{isScheduling ? 'Đang xếp TKB...' : 'Xếp TKB'}</span>
            </button>
            <button
              className="btn"
              style={{ backgroundColor: "#f59e0b", color: "white", display: "flex", alignItems: "center", gap: "6px", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}
              onClick={() => openActionModal("export")}
              disabled={loading || isGenerating || isScheduling || isExporting}
            >
              <Download size={18} />
              <span>{isExporting ? 'Đang xuất Excel...' : 'Xuất Excel TKB'}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              disabled={loading || isGenerating || isScheduling || isExporting}
            >
              <Plus size={18} />
              <span>Tạo lớp học phần</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar for Courses */}
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-control"
            value={filterSemesterId}
            onChange={(e) => {
              setFilterSemesterId(e.target.value);
              setCurrentPage(0);
              fetchData(searchCourseCode, e.target.value);
            }}
            style={{ maxWidth: "220px", fontWeight: 500 }}
          >
            <option value="">-- Tất cả học kỳ --</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo mã lớp hoặc tên môn..."
            value={searchCourseCode}
            onChange={(e) => setSearchCourseCode(e.target.value)}
            style={{ maxWidth: "280px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCurrentPage(0);
                fetchData(searchCourseCode, filterSemesterId);
              }
            }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => {
              setCurrentPage(0);
              fetchData(searchCourseCode, filterSemesterId);
            }}
          >
            Tìm kiếm
          </button>
          {(searchCourseCode || filterSemesterId) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchCourseCode("");
                setFilterSemesterId("");
                setCurrentPage(0);
                fetchData("", "");
              }}
            >
              Đặt lại
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
                  <th>Lịch & Phòng</th>
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
                    <td style={{ fontSize: "0.85rem", minWidth: "180px" }}>
                      {course.schedules && course.schedules.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {course.schedules.map((s, idx) => (
                            <div key={idx} style={{ 
                              padding: "4px 8px", 
                              borderRadius: "6px", 
                              backgroundColor: "rgba(99, 102, 241, 0.15)", 
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              color: "var(--text-main)"
                            }}>
                              <div style={{ fontWeight: 600, color: "var(--primary)" }}>Thứ {s.dayOfWeek}: {s.timeString || `Tiết ${s.startPeriod}-${s.endPeriod}`}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Phòng: <span style={{ fontWeight: 600, color: "#10b981" }}>{s.roomName || "Chưa gán"}</span></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có lịch</span>
                      )}
                    </td>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Hiển thị {(currentPage * pageSize) + 1} đến {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} lớp học phần
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    Trước
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => {
                    if (
                      i === 0 || 
                      i === totalPages - 1 || 
                      (i >= currentPage - 1 && i <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i}
                          className={`btn ${currentPage === i ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setCurrentPage(i)}
                          style={{ padding: '0.4rem 0.8rem', minWidth: '40px' }}
                        >
                          {i + 1}
                        </button>
                      );
                    } else if (
                      i === currentPage - 2 || 
                      i === currentPage + 2
                    ) {
                      return <span key={i} style={{ padding: '0.4rem 0.2rem', color: 'var(--text-muted)' }}>...</span>;
                    }
                    return null;
                  })}

                  <button 
                    className="btn btn-secondary" 
                    disabled={currentPage === totalPages - 1 || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
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

                  <div className="form-group" style={{ position: "relative" }}>
                    <label className="form-label">
                      Môn Học <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Gõ mã hoặc tên môn học để tìm kiếm..."
                      value={subjectSearchText}
                      onChange={(e) => {
                        setSubjectSearchText(e.target.value);
                        setSubjectId("");
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      required={!subjectId}
                    />
                    {isSearchingSubject && (
                      <span style={{ position: "absolute", right: "12px", top: "38px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Đang tìm...
                      </span>
                    )}
                    {showSuggestions && (
                      <div
                        className="autocomplete-dropdown"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: "220px",
                          overflowY: "auto",
                          backgroundColor: "var(--card-bg)",
                          border: "1px solid var(--card-border)",
                          borderRadius: "var(--radius-md)",
                          zIndex: 1000,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          marginTop: "4px",
                        }}
                      >
                        {subjectSuggestions.length === 0 ? (
                          <div style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {isSearchingSubject ? "Đang tìm kiếm..." : "Không tìm thấy môn học phù hợp"}
                          </div>
                        ) : (
                          subjectSuggestions.map((s: any) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSubjectId(s.id.toString());
                                setSubjectSearchText(`${s.subjectCode} - ${s.name}`);
                                setShowSuggestions(false);
                              }}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--card-border)",
                                fontSize: "0.9rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <span style={{ fontWeight: 500, color: "var(--primary)" }}>{s.subjectCode}</span>
                              <span style={{ color: "var(--text-primary)" }}>{s.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {subjectId && (
                      <small style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>
                        ✓ Đã chọn môn học (ID: {subjectId})
                      </small>
                    )}
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

        {/* Custom Action Modal (Generate Courses, Schedule TKB, Export Excel) */}
        {actionModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "480px" }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {actionModal.type === "generate" && <Zap size={22} style={{ color: "#10b981" }} />}
                  {actionModal.type === "schedule" && <Calendar size={22} style={{ color: "#6366f1" }} />}
                  {actionModal.type === "export" && <Download size={22} style={{ color: "#f59e0b" }} />}
                  <span>
                    {actionModal.type === "generate" && "Tự Động Sinh Lớp Học Phần"}
                    {actionModal.type === "schedule" && "Tự Động Xếp Thời Khóa Biểu"}
                    {actionModal.type === "export" && "Xuất Excel Thời Khóa Biểu"}
                  </span>
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ textAlign: "left" }}>
                <p style={{ color: "var(--text-main)", lineHeight: "1.5", marginBottom: "1.25rem" }}>
                  {actionModal.type === "generate" &&
                    "Hệ thống sẽ phân tích dữ liệu đăng ký nguyện vọng của sinh viên để tự động tạo ra các lớp học phần tương ứng cho học kỳ được chọn."}
                  {actionModal.type === "schedule" &&
                    "Hệ thống sẽ chạy thuật toán để tự động xếp lịch học, phòng học và ca học cho các lớp ở trạng thái Chuẩn Bị Mở (PLANNED)."}
                  {actionModal.type === "export" &&
                    "Tải xuống báo cáo bảng tính Excel chi tiết toàn bộ lịch học và thời khóa biểu của học kỳ được chọn."}
                </p>

                <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
                    Chọn Học Kỳ Áp Dụng:
                  </label>
                  <select
                    className="form-control"
                    value={actionModal.semesterId}
                    onChange={(e) => setActionModal({ ...actionModal, semesterId: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "0.95rem" }}
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {actionModal.type !== "export" && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fff8e1",
                      borderLeft: "4px solid #f59e0b",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      color: "#b78103",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>
                      <strong>Lưu ý:</strong> Quá trình xử lý dữ liệu và thuật toán tối ưu có thể mất từ vài giây đến một phút. Vui lòng không đóng tab hoặc làm mới trang trong quá trình thực hiện!
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor:
                      actionModal.type === "generate"
                        ? "#10b981"
                        : actionModal.type === "schedule"
                          ? "#6366f1"
                          : "#f59e0b",
                    color: "white",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={confirmActionModal}
                >
                  {actionModal.type === "generate" && <Zap size={16} />}
                  {actionModal.type === "schedule" && <Calendar size={16} />}
                  {actionModal.type === "export" && <Download size={16} />}
                  <span>Xác nhận thực hiện</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default Courses;
