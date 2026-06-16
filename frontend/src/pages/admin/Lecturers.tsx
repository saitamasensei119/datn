import React, { useEffect, useState } from "react";
import { lecturerApi, departmentApi } from "../../services/api";
import { Plus, Edit2, Trash2, X, AlertTriangle, Key } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
interface Department {
  id: number;
  name: string;
}

interface Lecturer {
  id: number;
  lecturerCode: string;
  fullName: string;
  email: string;
  departmentName: string;
  departmentId?: number;
  status?: string;
}

const Lecturers: React.FC = () => {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lecturerCode, setLecturerCode] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lectRes, deptRes] = await Promise.all([
        lecturerApi.getAll(),
        departmentApi.getAll(),
      ]);

      // Standardize response
      const mappedLecturers = lectRes.data.map((l: any) => ({
        id: l.id,
        lecturerCode: l.lecturerCode,
        fullName: l.fullName || "",
        email: l.email || "",
        departmentName: l.departmentName || "Chưa có",
        status: l.status || "ACTIVE",
        departmentId:
          deptRes.data.find((d: any) => d.name === l.departmentName)?.id ||
          undefined,
      }));

      setLecturers(mappedSubjects(mappedLecturers, deptRes.data));
      setDepartments(deptRes.data);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách giảng viên hoặc khoa.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to resolve department IDs from department names if not provided directly
  const mappedSubjects = (lects: any[], depts: Department[]) => {
    return lects.map((l) => {
      if (!l.departmentId && l.departmentName) {
        const found = depts.find(
          (d) => d.name.toLowerCase() === l.departmentName.toLowerCase(),
        );
        if (found) l.departmentId = found.id;
      }
      return l;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalType("create");
    setFullName("");
    setEmail("");
    setPassword("");
    setLecturerCode("");
    setDepartmentId(departments[0]?.id.toString() || "");
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lect: Lecturer) => {
    setModalType("edit");
    setFullName(lect.fullName);
    setEmail(lect.email);
    setPassword(""); // don't load password in edit
    setLecturerCode(lect.lecturerCode);
    setDepartmentId(lect.departmentId?.toString() || "");
    setSelectedId(lect.id);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (lectId: number, newStatus: string) => {
    try {
      await lecturerApi.changeStatus(lectId, newStatus);
      setSuccess(`Cập nhật trạng thái giảng viên thành công!`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái.",
      );
    }
  };

  const openStatusModal = (lect: Lecturer) => {
    setSelectedStatus(lect.status || "ACTIVE");
    setStatusChangeId(lect.id);
  };

  const closeStatusModal = () => {
    setStatusChangeId(null);
  };

  const confirmStatusChange = async () => {
    if (statusChangeId !== null) {
      await handleStatusChange(statusChangeId, selectedStatus);
      closeStatusModal();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !lecturerCode.trim() ||
      !departmentId
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    if (modalType === "create" && !password.trim()) {
      setError("Vui lòng nhập mật khẩu cho tài khoản giảng viên.");
      return;
    }

    try {
      if (modalType === "create") {
        const payload = {
          fullName,
          email,
          password,
          lecturerCode,
          departmentId: Number(departmentId),
        };
        await lecturerApi.create(payload);
        setSuccess("Thêm giảng viên và tài khoản mới thành công!");
      } else if (modalType === "edit" && selectedId !== null) {
        const payload = {
          fullName,
          email,
          lecturerCode,
          departmentId: Number(departmentId),
        };
        await lecturerApi.update(selectedId, payload);
        setSuccess("Cập nhật thông tin giảng viên thành công!");
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu giảng viên.",
      );
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  return (
    <>
      <AdminLayout>
        <div className="glass-card">
          <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>
              Quản Lý Giảng Viên
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              Xem, thêm mới và quản lý tài khoản của giảng viên các bộ môn
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Thêm giảng viên</span>
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
        ) : lecturers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            Chưa có giảng viên nào.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Mã GV</th>
                  <th>Họ tên giảng viên</th>
                  <th>Email tài khoản</th>
                  <th>Bộ môn / Khoa</th>
                  <th style={{ width: "110px", textAlign: "center" }}>
                    Trạng thái
                  </th>
                  <th style={{ width: "120px", textAlign: "center" }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((lect) => (
                  <tr key={lect.id}>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                      {lect.lecturerCode}
                    </td>
                    <td style={{ fontWeight: "500" }}>{lect.fullName}</td>
                    <td>{lect.email}</td>
                    <td>{lect.departmentName}</td>
                    <td style={{ textAlign: "center", fontSize: "0.85rem" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            lect.status === "ACTIVE" ? "#c8e6c9" : "#ffcccc",
                          color:
                            lect.status === "ACTIVE" ? "#2e7d32" : "#c62828",
                          fontWeight: "500",
                        }}
                      >
                        {lect.status === "ACTIVE"
                          ? "Hoạt động"
                          : lect.status === "ON_LEAVE"
                            ? "Tạm nghỉ"
                            : lect.status === "RETIRED"
                              ? "Về hưu"
                              : "Từ chức"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: "center" }}
                      >
                        <button
                          className="btn-icon-only edit"
                          onClick={() => openEditModal(lect)}
                          title="Chỉnh sửa giảng viên"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon-only delete"
                          onClick={() => openStatusModal(lect)}
                          title="Thay đổi trạng thái"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </AdminLayout>

      {/* Status Change Modal */}
      {statusChangeId !== null && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "400px" }}>
              <div className="modal-header">
                <h3 className="modal-title">Thay đổi trạng thái giảng viên</h3>
                <button className="modal-close" onClick={closeStatusModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Trạng thái mới:</label>
                  <select
                    className="form-control"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="ON_LEAVE">Tạm nghỉ</option>
                    <option value="RETIRED">Về hưu</option>
                    <option value="RESIGNED">Từ chức</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ gap: "10px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={closeStatusModal}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmStatusChange}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalType === "create"
                    ? "Thêm giảng viên mới"
                    : "Cập nhật thông tin"}
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
                    <label className="form-label" htmlFor="lect-code">
                      Mã giảng viên{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="lect-code"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: GV1023"
                      value={lecturerCode}
                      onChange={(e) => setLecturerCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lect-name">
                      Họ và tên giảng viên{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="lect-name"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lect-email">
                      Địa chỉ Email{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="lect-email"
                      type="email"
                      className="form-control"
                      placeholder="example@school.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {modalType === "create" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="lect-password">
                        Mật khẩu tài khoản{" "}
                        <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        id="lect-password"
                        type="password"
                        className="form-control"
                        placeholder="Nhập mật khẩu ban đầu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="lect-dept">
                      Khoa / Ngành công tác{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    {departments.length === 0 ? (
                      <div
                        style={{ color: "var(--danger)", fontSize: "0.85rem" }}
                      >
                        Cảnh báo: Cần tạo ít nhất 1 khoa trước!
                      </div>
                    ) : (
                      <select
                        id="lect-dept"
                        className="form-control"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          -- Chọn khoa công tác --
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
    </>
  );
};

export default Lecturers;
