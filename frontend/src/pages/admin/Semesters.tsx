import React, { useEffect, useState } from "react";
import { semesterApi } from "../../services/api";
import { Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

const Semesters: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await semesterApi.getAll();
      setSemesters(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách học kỳ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const openCreateModal = () => {
    setModalType("create");
    setName("");

    // Default dates to current date
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);

    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sem: Semester) => {
    setModalType("edit");
    setName(sem.name);

    // Ensure format is YYYY-MM-DD for input[type=date]
    setStartDate(sem.startDate);
    setEndDate(sem.endDate);

    setSelectedId(sem.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !startDate || !endDate) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }

    const payload = {
      name,
      startDate,
      endDate,
    };

    try {
      if (modalType === "create") {
        await semesterApi.create(payload);
        setSuccess("Tạo học kỳ mới thành công!");
      } else if (modalType === "edit" && selectedId !== null) {
        await semesterApi.update(selectedId, payload);
        setSuccess("Cập nhật học kỳ thành công!");
      }
      setIsModalOpen(false);
      fetchSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi lưu học kỳ.");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa học kỳ này? Các lớp học phần đăng ký cho học kỳ này sẽ bị xóa theo.",
      )
    ) {
      return;
    }

    setError("");
    try {
      await semesterApi.delete(id);
      setSuccess("Xóa học kỳ thành công!");
      fetchSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không thể xóa học kỳ. Học kỳ có thể đang chứa lớp học phần hoạt động.",
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AdminLayout>
      <div className="glass-card">
        <div className="page-header-flex">
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>
              Quản Lý Học Kỳ
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              Thiết lập các học kỳ học thuật (kỳ học, ngày bắt đầu và kết thúc)
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Thêm học kỳ</span>
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
        ) : semesters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            Chưa có học kỳ nào được cấu hình.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Tên Học Kỳ</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th style={{ width: "120px", textAlign: "center" }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((sem) => (
                  <tr key={sem.id}>
                    <td>{sem.id}</td>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                      {sem.name}
                    </td>
                    <td>{formatDate(sem.startDate)}</td>
                    <td>{formatDate(sem.endDate)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        className="table-actions"
                        style={{ justifyContent: "center" }}
                      >
                        <button
                          className="btn-icon-only edit"
                          onClick={() => openEditModal(sem)}
                          title="Chỉnh sửa học kỳ"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon-only delete"
                          onClick={() => handleDelete(sem.id)}
                          title="Xóa học kỳ"
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
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalType === "create"
                    ? "Tạo học kỳ mới"
                    : "Cập nhật học kỳ"}
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
                    <label className="form-label" htmlFor="sem-name">
                      Tên học kỳ{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="sem-name"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Học kỳ 2025.1 hoặc Kỳ Hè 2025"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="start-date">
                      Ngày bắt đầu{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="end-date">
                      Ngày kết thúc{" "}
                      <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
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
                    {modalType === "create" ? "Tạo mới" : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default Semesters;
