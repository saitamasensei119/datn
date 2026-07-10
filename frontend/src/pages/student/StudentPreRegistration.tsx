import React, { useState, useEffect } from "react";
import { semesterApi, subjectApi, preRegistrationApi } from "../../services/api";
import { AlertTriangle, Plus, Trash2, Check, Search } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import "./StudentEnroll.css"; // Reuse enroll styles

interface Semester {
  id: number;
  name: string;
  status: string;
}

interface Subject {
  id: number;
  subjectCode: string;
  name: string;
  credits: number;
  departmentName: string;
  subjectType: string;
}

interface PreRegistration {
  id: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
}

const StudentPreRegistration: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [semesterStatus, setSemesterStatus] = useState("");
  
  const [myIntents, setMyIntents] = useState<PreRegistration[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, _setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester !== "") {
      const sem = semesters.find(s => s.id === Number(selectedSemester));
      if (sem) {
        setSemesterStatus(sem.status);
        if (sem.status === "PRE_REGISTRATION_OPEN") {
          fetchMyIntents(sem.id);
          fetchSubjects();
        } else {
          setMyIntents([]);
          setTotalCredits(0);
        }
      }
    }
  }, [selectedSemester, currentPage, pageSize]);

  const fetchSemesters = async () => {
    try {
      const res = await semesterApi.getAll();
      setSemesters(res.data);
      if (res.data.length > 0) {
        setSelectedSemester(res.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách học kỳ.");
    }
  };

  const fetchMyIntents = async (semId: number) => {
    try {
      const res = await preRegistrationApi.getMyIntents(semId);
      setMyIntents(res.data);
      const creditsRes = await preRegistrationApi.getMyTotalCredits(semId);
      setTotalCredits(creditsRes.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getPaginated(currentPage, pageSize, searchKeyword);
      const mapped = res.data.content.map((subj: any) => ({
        id: subj.id,
        subjectCode: subj.subjectCode,
        name: subj.name,
        credits: subj.credits,
        departmentName: subj.departmentName,
        subjectType: subj.subjectType,
      }));
      setSubjects(mapped);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchSubjects();
  };

  const handleRegister = async (subjectId: number, ignoreWarning: boolean = false) => {
    setError("");
    setSuccess("");
    try {
      await preRegistrationApi.registerIntent(subjectId, Number(selectedSemester), ignoreWarning);
      setSuccess("Đăng ký nguyện vọng thành công!");
      fetchMyIntents(Number(selectedSemester));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data || "Có lỗi xảy ra khi đăng ký nguyện vọng.";
      
      if (typeof errMsg === 'string' && errMsg.startsWith("WARNING_EQUIVALENT:")) {
        const confirmMsg = errMsg.substring("WARNING_EQUIVALENT:".length);
        if (window.confirm(confirmMsg)) {
          handleRegister(subjectId, true);
        }
      } else {
        setError(errMsg);
      }
    }
  };

  const handleRemove = async (intentId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký môn này?")) return;
    setError("");
    setSuccess("");
    try {
      await preRegistrationApi.removeIntent(intentId);
      setSuccess("Hủy nguyện vọng thành công!");
      fetchMyIntents(Number(selectedSemester));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data || "Lỗi khi hủy nguyện vọng.");
    }
  };

  const isSubjectRegistered = (subjectId: number) => {
    return myIntents.some((intent) => intent.subjectId === subjectId);
  };

  const progressPercent = Math.min((totalCredits / 25) * 100, 100);

  return (
    <StudentLayout>
      <div className="page-container">
        <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Đăng Ký Nguyện Vọng</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>Học kỳ:</span>
            <select
              className="form-control"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value !== "" ? Number(e.target.value) : "")}
              style={{ width: "200px" }}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {semesterStatus !== "PRE_REGISTRATION_OPEN" ? (
          <div className="alert alert-warning" style={{ margin: "2rem" }}>
            <AlertTriangle size={20} />
            <span style={{ marginLeft: "10px" }}>
              Đợt đăng ký nguyện vọng cho học kỳ này đang đóng. Xin vui lòng quay lại sau.
            </span>
          </div>
        ) : (
          <div className="card-body">
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

            {/* Progress bar */}
            <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Tiến độ đăng ký</span>
                <span><strong style={{ color: totalCredits > 25 ? 'var(--danger)' : 'var(--primary)' }}>{totalCredits}</strong> / 25 Tín chỉ</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--card-border)', borderRadius: '5px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${progressPercent}%`, 
                    backgroundColor: totalCredits >= 25 ? 'var(--danger)' : 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>

            <div className="enroll-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left Column: Subject Search & List */}
              <div className="available-courses">
                <h3 style={{ marginBottom: "1rem" }}>Danh sách Môn Học</h3>
                
                {/* Search */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
                  <div className="search-wrapper" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} className="search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm theo mã hoặc tên môn..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      style={{ paddingLeft: '35px', width: '100%' }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <button className="btn btn-secondary" onClick={handleSearch}>
                    Tìm kiếm
                  </button>
                </div>

                {/* Subject List */}
                {loading ? (
                  <div className="spinner" style={{ margin: "2rem auto" }}></div>
                ) : (
                  <div className="table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
                    <table className="custom-table">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Mã môn</th>
                          <th>Tên môn</th>
                          <th>TC</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subj) => {
                          const isRegistered = isSubjectRegistered(subj.id);
                          return (
                            <tr key={subj.id}>
                              <td style={{ fontWeight: "600", color: "var(--primary)" }}>{subj.subjectCode}</td>
                              <td>{subj.name}</td>
                              <td>{subj.credits}</td>
                              <td>
                                {isRegistered ? (
                                  <button className="btn btn-secondary" disabled style={{ padding: "0.2rem 0.5rem" }}>
                                    <Check size={16} /> Đã ĐK
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleRegister(subj.id)}
                                    style={{ padding: "0.2rem 0.5rem" }}
                                    title="Đăng ký nguyện vọng"
                                  >
                                    <Plus size={16} /> Đăng ký
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {subjects.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
                              Không tìm thấy môn học nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Trước
                    </button>
                    <span style={{ alignSelf: 'center', margin: '0 10px' }}>{currentPage + 1} / {totalPages}</span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Registered Intents */}
              <div className="my-enrollments">
                <h3 style={{ marginBottom: "1rem" }}>Nguyện Vọng Của Tôi</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã môn</th>
                        <th>Tên môn</th>
                        <th>TC</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myIntents.map((intent) => (
                        <tr key={intent.id}>
                          <td style={{ fontWeight: "600" }}>{intent.subjectCode}</td>
                          <td>{intent.subjectName}</td>
                          <td>{intent.credits}</td>
                          <td>
                            <button
                              className="btn-icon-only delete"
                              onClick={() => handleRemove(intent.id)}
                              title="Hủy nguyện vọng"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {myIntents.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                            Bạn chưa đăng ký môn nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </StudentLayout>
  );
};

export default StudentPreRegistration;
