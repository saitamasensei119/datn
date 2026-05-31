import React, { useEffect, useState } from "react";
import { subjectApi, departmentApi } from "../../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  BookMarked,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

interface Department {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  subjectCode: string;
  name: string;
  credits: number;
  departmentName: string;
  departmentId?: number;
}

const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [subjectCode, setSubjectCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number>(3);
  const [departmentId, setDepartmentId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectRes, deptRes] = await Promise.all([
        subjectApi.getAll(),
        departmentApi.getAll(),
      ]);

      // Standardize the subject model (in case response structure differs)
      const mappedSubjects = subjectRes.data.map((subj: any) => ({
        id: subj.id,
        subjectCode: subj.subjectCode,
        name: subj.name,
        credits: subj.credits,
        departmentName: subj.department
          ? subj.department.name
          : "Chưa phân khoa",
        departmentId: subj.department ? subj.department.id : undefined,
      }));

      setSubjects(mappedSubjects);
      setDepartments(deptRes.data);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách môn học hoặc khoa/ngành.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalType("create");
    setSubjectCode("");
    setName("");
    setCredits(3);
    setDepartmentId(departments[0]?.id.toString() || "");
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setModalType("edit");
    setSubjectCode(subj.subjectCode);
    setName(subj.name);
    setCredits(subj.credits);
    setDepartmentId(subj.departmentId?.toString() || "");
    setSelectedId(subj.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subjectCode.trim() || !name.trim() || !departmentId) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    const payload = {
      subjectCode,
      name,
      credits: Number(credits),
      departmentId: Number(departmentId),
    };

    try {
      if (modalType === "create") {
        await subjectApi.create(payload);
        setSuccess("Tạo môn học mới thành công!");
      } else if (modalType === "edit" && selectedId !== null) {
        await subjectApi.update(selectedId, payload);
        setSuccess("Cập nhật môn học thành công!");
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi lưu môn học.");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa môn học này? Các lớp học phần liên quan đến môn học này sẽ bị ảnh hưởng.",
      )
    ) {
      return;
    }

    setError("");
    try {
      await subjectApi.delete(id);
      setSuccess("Xóa môn học thành công!");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không thể xóa môn học. Môn học này có thể đang được giảng dạy trong một lớp học phần.",
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <AdminLayout>
      <div className="glass-card">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>
              Quản Lý Môn Học
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              Quản lý chương trình học, môn học và số tín chỉ tương ứng
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Thêm môn học</span>
          </button>
        </div>

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        {error && !isModalOpen && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <div className="spinner"></div>
          </div>
        ) : subjects.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            Chưa có môn học nào được thiết lập. Hãy bấm nút tạo mới.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Mã môn học</th>
                  <th>Tên môn học</th>
                  <th style={{ width: "100px", textAlign: "center" }}>
                    Số tín chỉ
                  </th>
                  <th>Thuộc Khoa/Ngành</th>
                  <th style={{ width: "120px", textAlign: "center" }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj) => (
                  <tr key={subj.id}>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                      {subj.subjectCode}
                    </td>
                    <td style={{ fontWeight: "500" }}>{subj.name}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-info">
                        {subj.credits} TC
                      </span>
                    </td>
                    <td>{subj.departmentName}</td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: "center" }}
                      >
                        <button
                          className="btn-icon-only edit"
                          onClick={() => openEditModal(subj)}
                          title="Chỉnh sửa môn học"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon-only delete"
                          onClick={() => handleDelete(subj.id)}
                          title="Xóa môn học"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                    ? "Tạo môn học mới"
                    : "Cập nhật môn học"}
                </h3>
                <button className="modal-close" onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
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
                    <label className="form-label" htmlFor="subj-code">
                      Mã môn học{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="subj-code"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: IT3180"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      required
                      disabled={modalType === "edit"} // block changing subject code in edit
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-name">
                      Tên môn học{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="subj-name"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Mạng máy tính"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-credits">
                      Số tín chỉ{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="subj-credits"
                      type="number"
                      min="1"
                      max="10"
                      className="form-control"
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-dept">
                      Khoa phụ trách quản lý{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    {departments.length === 0 ? (
                      <div
                        style={{ color: "var(--danger)", fontSize: "0.85rem" }}
                      >
                        Cảnh báo: Cần tạo ít nhất 1 khoa trước khi thêm môn học!
                      </div>
                    ) : (
                      <select
                        id="subj-dept"
                        className="form-control"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          -- Chọn khoa phụ trách --
                        </option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    )}
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={departments.length === 0}
                  >
                    {modalType === "create" ? "Tạo mới" : "Lưu thay đổi"}
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

export default Subjects;
