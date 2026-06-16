import React, { useEffect, useState } from "react";
import { studentApi, departmentApi } from "../../services/api";
import {
  Plus,
  Edit2,
  Search,
  X,
  AlertTriangle,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

interface Department {
  id: number;
  name: string;
}

interface StudentProfile {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  departmentName: string;
  departmentId?: number;
  status?: string;
}

const Students: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<StudentProfile | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const [deptRes, studRes] = await Promise.all([
          departmentApi.getAll(),
          studentApi.getAll(),
        ]);
        setDepartments(deptRes.data);
        setStudents(
          studRes.data.map((s: any) => ({
            id: s.id,
            studentCode: s.studentCode,
            fullName: s.fullName,
            email: s.email,
            departmentName: s.departmentName || "Chưa có",
            status: s.status || "ACTIVE",
          })),
        );
      } catch (err: any) {
        console.error(err);
        setError("Không thể tải danh sách.");
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchedStudent(null);

    try {
      const response = await studentApi.getByStudentCode(searchCode);
      const s = response.data;

      // Map response fields
      const deptName = s.departmentName || s.department?.name || "Chưa có";
      const deptId = departments.find((d) => d.name === deptName)?.id;

      setSearchedStudent({
        id: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName || s.user?.fullName || "",
        email: s.email || s.user?.email || "",
        departmentName: deptName,
        departmentId: deptId,
        status: s.status || "ACTIVE",
      });
    } catch (err: any) {
      console.error(err);
      setSearchError("Không tìm thấy sinh viên có Mã này hoặc có lỗi xảy ra.");
    } finally {
      setSearchLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalType("create");
    setFullName("");
    setEmail("");
    setPassword("");
    setStudentCode("");
    setDepartmentId(departments[0]?.id.toString() || "");
    setIsModalOpen(true);
    setError("");
  };

  const handleStatusChange = async (studentId: number, newStatus: string) => {
    try {
      await studentApi.changeStatus(studentId, newStatus);
      setSuccess("Cập nhật trạng thái sinh viên thành công!");
      if (searchedStudent?.id === studentId) {
        setSearchedStudent({ ...searchedStudent, status: newStatus });
      }
      setStudents(
        students.map((s) =>
          s.id === studentId ? { ...s, status: newStatus } : s,
        ),
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái.",
      );
    }
  };

  const openStatusModal = (student: StudentProfile) => {
    setSelectedStatus(student.status || "ACTIVE");
    setStatusChangeId(student.id);
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
  

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };
  const openEditModal = () => {
  if (!searchedStudent) return;

  setModalType("edit");
  setFullName(searchedStudent.fullName);
  setEmail(searchedStudent.email);
  setPassword("");
  setStudentCode(searchedStudent.studentCode);
  setDepartmentId(searchedStudent.departmentId?.toString() || "");
  setIsModalOpen(true);
  setError("");
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !studentCode.trim() ||
      !departmentId
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    if (modalType === "create" && !password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      if (modalType === "create") {
        const payload = {
          fullName,
          email,
          password,
          studentCode,
          departmentId: Number(departmentId),
        };
        const response = await studentApi.create(payload);
        setSuccess(
          `Thêm sinh viên thành công! Sinh viên được tạo có ID: ${response.data.id}`,
        );
        // Automatically search for the newly created student to display them
        setSearchCode(response.data.studentCode);
        setSearchedStudent({
          id: response.data.id,
          studentCode: response.data.studentCode,
          fullName: response.data.fullName,
          email: response.data.email,
          departmentName: response.data.departmentName || "Chưa có",
          departmentId: Number(departmentId),
          status: response.data.status || "ACTIVE",
        });
      } else if (modalType === "edit" && searchedStudent !== null) {
        const payload = {
          fullName,
          email,
          studentCode,
          departmentId: Number(departmentId),
        };
        await studentApi.update(searchedStudent.id, payload);
        setSuccess("Cập nhật thông tin sinh viên thành công!");
        // Refresh search results
        setSearchedStudent({
          ...searchedStudent,
          fullName,
          email,
          studentCode,
          departmentId: Number(departmentId),
          departmentName:
            departments.find((d) => d.id === Number(departmentId))?.name ||
            "Chưa có",
          status: searchedStudent.status || "ACTIVE",
        });
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu dữ liệu sinh viên.",
      );
    }
  };

  return (
    <AdminLayout>
      <div className="glass-card">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>
              Quản Lý Sinh Viên
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              Thêm mới sinh viên và tìm kiếm hồ sơ học tập cá nhân bằng Mã SV
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={loading}
          >
            <Plus size={18} />
            <span>Thêm sinh viên</span>
          </button>
        </div>

        {success && (
          <div className="alert alert-success" style={{ margin: "1rem 0" }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Info notice about current API constraints */}

        <div
          className="details-grid"
          style={{
            gridTemplateColumns: "1fr",
            maxWidth: "600px",
            margin: "0 auto 2rem auto",
          }}
        >
          {/* Search Form Card */}
          <div
            className="glass-card"
            style={{ padding: "1.5rem", marginBottom: 0 }}
          >
            <h3
              style={{
                fontSize: "1rem",
                marginBottom: "1rem",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Search size={18} style={{ color: "var(--primary)" }} />
              <span>Tra cứu Sinh viên bằng Mã SV</span>
            </h3>
            <form
              onSubmit={handleSearch}
              className="search-bar-container"
              style={{ maxWidth: "none" }}
            >
              <input
                type="text"
                placeholder="Nhập mã sinh viên cần tìm... (ví dụ: SV001)"
                className="form-control"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={searchLoading}
              >
                {searchLoading ? <div className="spinner"></div> : "Tìm kiếm"}
              </button>
            </form>

            {searchError && (
              <div
                className="alert alert-danger"
                style={{
                  marginTop: "1rem",
                  textAlign: "left",
                  marginBottom: 0,
                }}
              >
                <AlertTriangle size={18} />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search Result Display */}
        {searchedStudent && (
          <div
            className="glass-card"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              textAlign: "left",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.15rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: 0,
                }}
              >
                <GraduationCap size={22} style={{ color: "var(--primary)" }} />
                <span>Hồ sơ Sinh viên #{searchedStudent.id}</span>
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={openEditModal}
                >
                  <Edit2 size={14} />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openStatusModal(searchedStudent)}
                  title="Thay đổi trạng thái"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: "4px" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Trạng thái
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
              }}
            >
              <div className="detail-item">
                <div className="detail-label">Mã số sinh viên</div>
                <div
                  className="detail-value"
                  style={{ color: "var(--primary)" }}
                >
                  {searchedStudent.studentCode}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Họ và tên</div>
                <div className="detail-value">{searchedStudent.fullName}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Địa chỉ Email</div>
                <div className="detail-value">{searchedStudent.email}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Khoa / Ngành học</div>
                <div className="detail-value">
                  {searchedStudent.departmentName}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Trạng thái</div>
                <div className="detail-value">
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        searchedStudent.status === "ACTIVE"
                          ? "#c8e6c9"
                          : searchedStudent.status === "SUSPENDED"
                            ? "#ffcccc"
                            : searchedStudent.status === "DROPPED_OUT"
                              ? "#ffe0b2"
                              : "#e8f5e9",
                      color:
                        searchedStudent.status === "ACTIVE"
                          ? "#2e7d32"
                          : searchedStudent.status === "SUSPENDED"
                            ? "#c62828"
                            : searchedStudent.status === "DROPPED_OUT"
                              ? "#e65100"
                              : "#1b5e20",
                      fontWeight: "500",
                      fontSize: "0.9rem",
                    }}
                  >
                    {searchedStudent.status === "ACTIVE"
                      ? "Đang học"
                      : searchedStudent.status === "SUSPENDED"
                        ? "Tạm ngừng"
                        : searchedStudent.status === "DROPPED_OUT"
                          ? "Thôi học"
                          : "Tốt nghiệp"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Students List */}
        {!searchedStudent && showAllStudents && (
          <div className="table-container" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Danh sách tất cả sinh viên</h3>
            {students.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                Chưa có sinh viên nào
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: "100px" }}>Mã SV</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Trạng thái</th>
                    <th style={{ width: "100px", textAlign: "center" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                        {s.studentCode}
                      </td>
                      <td>{s.fullName}</td>
                      <td>{s.email}</td>
                      <td style={{ textAlign: "center", fontSize: "0.85rem" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              s.status === "ACTIVE"
                                ? "#c8e6c9"
                                : s.status === "SUSPENDED"
                                  ? "#ffcccc"
                                  : "#e8f5e9",
                            color:
                              s.status === "ACTIVE"
                                ? "#2e7d32"
                                : s.status === "SUSPENDED"
                                  ? "#c62828"
                                  : "#1b5e20",
                          }}
                        >
                          {s.status === "ACTIVE"
                            ? "Đang học"
                            : s.status === "SUSPENDED"
                              ? "Tạm ngừng"
                              : "Tốt nghiệp"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn-icon-only delete"
                          onClick={() => openStatusModal(s)}
                          title="Thay đổi trạng thái"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!searchedStudent && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAllStudents(!showAllStudents)}
            >
              {showAllStudents ? "Ẩn danh sách" : "Xem tất cả sinh viên"}
            </button>
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
                    ? "Tạo sinh viên mới"
                    : "Cập nhật sinh viên"}
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
                    <label className="form-label" htmlFor="std-code">
                      Mã số sinh viên{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="std-code"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: B20DCCN123"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="std-name">
                      Họ và tên{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="std-name"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Nguyễn Văn B"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="std-email">
                      Email đăng nhập{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="std-email"
                      type="email"
                      className="form-control"
                      placeholder="student@school.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {modalType === "create" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="std-password">
                        Mật khẩu tài khoản{" "}
                        <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        id="std-password"
                        type="password"
                        className="form-control"
                        placeholder="Nhập mật khẩu sinh viên"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="std-dept">
                      Khoa đào tạo quản lý{" "}
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
                        id="std-dept"
                        className="form-control"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          -- Chọn khoa đào tạo --
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

        {/* Status Change Modal */}
        {statusChangeId !== null && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "400px" }}>
              <div className="modal-header">
                <h3 className="modal-title">Thay đổi trạng thái sinh viên</h3>
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
                    <option value="ACTIVE">Đang học</option>
                    <option value="SUSPENDED">Tạm ngừng</option>
                    <option value="DROPPED_OUT">Thôi học</option>
                    <option value="GRADUATED">Tốt nghiệp</option>
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
    </AdminLayout>
  );
};

export default Students;
