import React, { useEffect, useState } from "react";
import { subjectApi, departmentApi, subjectConditionApi } from "../../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Link,
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
  englishName?: string;
  subjectType: string;
  labRequirement?: string;
  programCode?: string;
  note?: string;
  managementCode?: string;
}

interface SubjectCondition {
  id: number;
  subjectId: number;
  requiredSubjectId: number;
  requiredSubjectCode: string;
  requiredSubjectName: string;
  conditionType: string;
}

const getSubjectTypeLabel = (type: string) => {
  switch (type) {
    case "BT": return "Bài tập (BT)";
    case "ĐA": return "Đồ án (ĐA)";
    case "ĐATN": return "Đồ án tốt nghiệp (ĐATN)";
    case "ĐATNKS": return "Đồ án tốt nghiệp KS (ĐATNKS)";
    case "LT": return "Lý thuyết (LT)";
    case "LT+BT": return "Lý thuyết + Bài tập (LT+BT)";
    case "TH": return "Thực hành (TH)";
    case "TN": return "Thí nghiệm (TN)";
    case "TT": return "Thực tập (TT)";
    case "TTKS": return "Thực tập KS (TTKS)";
    case "TTKT": return "Thực tập Kỹ thuật (TTKT)";
    case "TTTN": return "Thực tập tốt nghiệp (TTTN)";
    default: return type;
  }
};

const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Condition Modal State
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [selectedSubjectForCondition, setSelectedSubjectForCondition] = useState<Subject | null>(null);
  const [conditions, setConditions] = useState<SubjectCondition[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [newConditionRequiredId, setNewConditionRequiredId] = useState("");
  const [newConditionType, setNewConditionType] = useState("PREREQUISITE");

  // Form Fields
  const [subjectCode, setSubjectCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number>(3);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [englishName, setEnglishName] = useState("");
  const [subjectType, setSubjectType] = useState("LT");
  const [labRequirement, setLabRequirement] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [note, setNote] = useState("");
  const [managementCode, setManagementCode] = useState("");

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
        departmentName: subj.departmentName || "Chưa phân khoa",
        departmentId: subj.departmentId,
        englishName: subj.englishName || "",
        subjectType: subj.subjectType || "LT",
        labRequirement: subj.labRequirement || "",
        programCode: subj.programCode || "",
        note: subj.note || "",
        managementCode: subj.managementCode || "",
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
    setEnglishName("");
    setSubjectType("LT");
    setLabRequirement("");
    setProgramCode("");
    setNote("");
    setManagementCode("");
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setModalType("edit");
    setSubjectCode(subj.subjectCode);
    setName(subj.name);
    setCredits(subj.credits);
    setDepartmentId(subj.departmentId?.toString() || "");
    setEnglishName(subj.englishName || "");
    setSubjectType(subj.subjectType || "LT");
    setLabRequirement(subj.labRequirement || "");
    setProgramCode(subj.programCode || "");
    setNote(subj.note || "");
    setManagementCode(subj.managementCode || "");
    setSelectedId(subj.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const openConditionModal = async (subj: Subject) => {
    setSelectedSubjectForCondition(subj);
    setIsConditionModalOpen(true);
    setLoadingConditions(true);
    setError("");
    setSuccess("");
    try {
      const res = await subjectConditionApi.getConditions(subj.id);
      setConditions(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách điều kiện môn học.");
    } finally {
      setLoadingConditions(false);
    }
  };

  const handleCloseConditionModal = () => {
    setIsConditionModalOpen(false);
    setSelectedSubjectForCondition(null);
    setNewConditionRequiredId("");
    setNewConditionType("PREREQUISITE");
  };

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForCondition) return;

    if (!newConditionRequiredId) {
      setError("Vui lòng chọn môn học ràng buộc.");
      return;
    }

    try {
      await subjectConditionApi.addCondition(selectedSubjectForCondition.id, {
        requiredSubjectId: Number(newConditionRequiredId),
        conditionType: newConditionType
      });
      setSuccess("Thêm điều kiện thành công!");
      
      // reload conditions
      const res = await subjectConditionApi.getConditions(selectedSubjectForCondition.id);
      setConditions(res.data);
      
      setNewConditionRequiredId("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi thêm điều kiện.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRemoveCondition = async (conditionId: number) => {
    if (!selectedSubjectForCondition) return;
    
    if (!window.confirm("Bạn có chắc chắn muốn xóa điều kiện này?")) return;

    try {
      await subjectConditionApi.removeCondition(selectedSubjectForCondition.id, conditionId);
      setSuccess("Xóa điều kiện thành công!");
      setConditions(conditions.filter(c => c.id !== conditionId));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa điều kiện.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await subjectApi.import(formData);
      const data = res.data;
      setSuccess(`Import thành công! Đã tạo ${data.created} môn, bỏ qua ${data.skipped} môn trùng, lỗi ${data.errors} dòng.`);
      setTimeout(() => setSuccess(""), 5000);
      fetchData();
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
      englishName,
      subjectType,
      labRequirement,
      programCode,
      note,
      managementCode,
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
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleImportExcel}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {isImporting ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                  Đang xử lý...
                </>
              ) : (
                "Import Excel"
              )}
            </button>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Thêm môn học</span>
            </button>
          </div>
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
                  <th>Tên tiếng Anh</th>
                  <th>Loại môn học</th>
                  <th style={{ width: "100px", textAlign: "center" }}>
                    Số tín chỉ
                  </th>
                  <th>Mã CTĐT</th>
                  <th>Mã QL</th>
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
                    <td>{subj.englishName || <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có</span>}</td>
                    <td>
                      <span className="badge badge-secondary" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid var(--card-border)" }}>
                        {getSubjectTypeLabel(subj.subjectType)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-info">
                        {subj.credits} TC
                      </span>
                    </td>
                    <td>{subj.programCode || <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có</span>}</td>
                    <td>
                      {subj.managementCode === "CT_CHUAN" 
                        ? "CT CHUẨN" 
                        : subj.managementCode || <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có</span>}
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
                          className="btn-icon-only edit"
                          style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)" }}
                          onClick={() => openConditionModal(subj)}
                          title="Cài đặt điều kiện tiên quyết"
                        >
                          <Link size={16} />
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
      </div>

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
                    <label className="form-label" htmlFor="subj-english-name">
                      Tên môn học tiếng Anh
                    </label>
                    <input
                      id="subj-english-name"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Computer Networks"
                      value={englishName}
                      onChange={(e) => setEnglishName(e.target.value)}
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
                      min="0"
                      max="10"
                      className="form-control"
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-type">
                      Loại môn học <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select
                      id="subj-type"
                      className="form-control"
                      value={subjectType}
                      onChange={(e) => setSubjectType(e.target.value)}
                      required
                    >
                      <option value="LT">Lý thuyết (LT)</option>
                      <option value="BT">Bài tập (BT)</option>
                      <option value="LT+BT">Lý thuyết + Bài tập (LT+BT)</option>
                      <option value="TH">Thực hành (TH)</option>
                      <option value="TN">Thí nghiệm (TN)</option>
                      <option value="ĐA">Đồ án (ĐA)</option>
                      <option value="ĐATN">Đồ án tốt nghiệp (ĐATN)</option>
                      <option value="ĐATNKS">Đồ án tốt nghiệp KS (ĐATNKS)</option>
                      <option value="TT">Thực tập (TT)</option>
                      <option value="TTKS">Thực tập KS (TTKS)</option>
                      <option value="TTKT">Thực tập Kỹ thuật (TTKT)</option>
                      <option value="TTTN">Thực tập tốt nghiệp (TTTN)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-program-code">
                      Mã CTĐT (Program Code)
                    </label>
                    <input
                      id="subj-program-code"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: KTPM-2022"
                      value={programCode}
                      onChange={(e) => setProgramCode(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-management-code">
                      Mã quản lý (Management Code) <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      id="subj-management-code"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: SP2023"
                      value={managementCode}
                      onChange={(e) => setManagementCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-lab">
                      Yêu cầu phòng thí nghiệm/máy tính
                    </label>
                    <input
                      id="subj-lab"
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Phòng máy PC, Server..."
                      value={labRequirement}
                      onChange={(e) => setLabRequirement(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subj-note">
                      Ghi chú
                    </label>
                    <textarea
                      id="subj-note"
                      className="form-control"
                      placeholder="Thông tin thêm..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{ minHeight: "80px", resize: "vertical" }}
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

      {/* Conditions Modal */}
      {isConditionModalOpen && selectedSubjectForCondition && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Điều Kiện Môn Học: {selectedSubjectForCondition.name} ({selectedSubjectForCondition.subjectCode})
              </h3>
              <button className="modal-close" onClick={handleCloseConditionModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
                  <span>{success}</span>
                </div>
              )}

              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Thêm điều kiện mới</h4>
                <form onSubmit={handleAddCondition} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Môn học ràng buộc</label>
                    <select
                      className="form-control"
                      value={newConditionRequiredId}
                      onChange={(e) => setNewConditionRequiredId(e.target.value)}
                      required
                    >
                      <option value="" disabled>-- Chọn môn học --</option>
                      {subjects.filter(s => s.id !== selectedSubjectForCondition.id).map(s => (
                        <option key={s.id} value={s.id}>{s.subjectCode} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Loại điều kiện</label>
                    <select
                      className="form-control"
                      value={newConditionType}
                      onChange={(e) => setNewConditionType(e.target.value)}
                    >
                      <option value="PREREQUISITE">Môn tiên quyết</option>
                      <option value="PRE_STUDY">Môn học trước</option>
                      <option value="COREQUISITE">Môn song hành</option>
                      <option value="EQUIVALENT">Môn tương đương</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.2rem" }}>
                    <Plus size={18} /> Thêm
                  </button>
                </form>
              </div>

              <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Danh sách điều kiện hiện tại</h4>
              {loadingConditions ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner"></div>
                </div>
              ) : conditions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", backgroundColor: "var(--card-bg)", borderRadius: "var(--radius-md)" }}>
                  Môn học này hiện chưa có điều kiện ràng buộc nào.
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã môn</th>
                        <th>Tên môn ràng buộc</th>
                        <th>Loại điều kiện</th>
                        <th style={{ width: "80px", textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditions.map((cond) => (
                        <tr key={cond.id}>
                          <td style={{ fontWeight: "600", color: "var(--primary)" }}>{cond.requiredSubjectCode}</td>
                          <td>{cond.requiredSubjectName}</td>
                          <td>
                            <span className={`badge ${
                              cond.conditionType === 'PREREQUISITE' ? 'badge-danger' : 
                              cond.conditionType === 'PRE_STUDY' ? 'badge-warning' : 
                              cond.conditionType === 'COREQUISITE' ? 'badge-info' : 'badge-secondary'
                            }`}>
                              {cond.conditionType === 'PREREQUISITE' ? 'Tiên quyết' :
                               cond.conditionType === 'PRE_STUDY' ? 'Học trước' :
                               cond.conditionType === 'COREQUISITE' ? 'Song hành' : 'Tương đương'}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon-only delete"
                              onClick={() => handleRemoveCondition(cond.id)}
                              title="Xóa điều kiện"
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
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseConditionModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Subjects;
