import React, { useEffect, useState } from "react";
import {
  courseApi,
  subjectApi,
  lecturerApi,
  semesterApi,
} from "../../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  BookOpen,
  CheckCircle,
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
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, subjRes, lectRes, semRes] = await Promise.all([
        courseApi.getAll(),
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
      maxStudents < 1
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
      fetchData();
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
      fetchData();
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
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={loading}
          >
            <Plus size={18} />
            <span>Tạo lớp học phần</span>
          </button>
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
                  <th style={{ width: "80px", textAlign: "center" }}>Sĩ Số</th>
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
                      {course.maxStudents}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-icon-only"
                        onClick={() => openEditModal(course)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
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
                    Giảng Viên <span style={{ color: "var(--danger)" }}>*</span>
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
      </div>
    </AdminLayout>
  );
};

export default Courses;
