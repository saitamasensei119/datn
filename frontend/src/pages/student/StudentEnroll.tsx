import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { courseApi, enrollmentApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BookMarked, Users, Search } from "lucide-react";
import "./StudentEnroll.css";

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
  credits?: number;
  studentCount?: number;
  schedules?: ClassSchedule[];
}

const StudentEnroll: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "courseCode" | "subjectCode" | "subjectName"
  >("courseCode");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourses = async (pageNum: number = 0, query?: string) => {
    setLoading(true);
    try {
      let response;
      if (query) {
        const params: any = { page: pageNum, size: 10 };
        params[searchType] = query;
        response = await courseApi.searchOpenCourses(
          pageNum,
          10,
          searchType === "courseCode" ? query : undefined,
          searchType === "subjectCode" ? query : undefined,
          searchType === "subjectName" ? query : undefined,
        );
      } else {
        response = await courseApi.getOpenCourses(pageNum, 10);
      }
      setCourses(response.data?.content || response.data || []);
      setTotalPages(response.data?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu lớp học phần");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseToggle = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      setError("Vui lòng chọn ít nhất một lớp học phần");
      return;
    }

    if (!user?.id) {
      setError("Không tìm thấy thông tin sinh viên");
      return;
    }

    setEnrolling(true);
    setError("");
    try {
      const enrollments = selectedCourses.map((courseId) => ({
        studentId: user.id,
        courseId: courseId,
      }));
      await enrollmentApi.enrollMultiple(enrollments);
      setSuccess(
        `Đã đăng ký ${selectedCourses.length} lớp học phần thành công!`,
      );
      setSelectedCourses([]);
      setTimeout(() => setSuccess(""), 3000);
      fetchCourses(page, searchQuery || undefined);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Đã xảy ra lỗi trong quá trình đăng ký",
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchCourses(0, searchQuery);
    } else {
      fetchCourses(0);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="page-container">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="page-header">
          <h2>Đăng Ký Học Phần</h2>
          <span className="selected-count">
            Đã chọn: {selectedCourses.length} lớp
          </span>
        </div>

        {/* Search Bar */}
         
        <div
          className="search-bar-container"
          style={{
            marginBottom: "2rem",
            display: "flex",
            gap: "1rem",
            maxWidth: "100%",
            width: "100%",
          }}
        >
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, position: "relative" }}>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="form-control"
              style={{ maxWidth: "180px", cursor: "pointer" }}
            >
              <option value="courseCode">Mã Lớp</option>
              <option value="subjectCode">Mã Môn</option>
              <option value="subjectName">Tên Môn</option>
            </select>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
              <Search 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "12px", 
                  color: "var(--text-secondary)" 
                }} 
              />
              <input
                type="text"
                placeholder="Nhập từ khóa để tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ 
                  width: "100%", 
                  paddingLeft: "38px",
                  paddingRight: searchQuery ? "38px" : "12px"
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchCourses(0);
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ whiteSpace: "nowrap" }}
            >
              Tìm kiếm
            </button>
          </form>
        </div> 
        

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <BookMarked size={48} color="var(--text-secondary)" />
            <p>Không có lớp học phần nào để đăng ký</p>
          </div>
        ) : (
          <>
            <div className="courses-grid">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`course-card ${selectedCourses.includes(course.id) ? "selected" : ""}`}
                  onClick={() => handleCourseToggle(course.id)}
                >
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="course-header">
                    <h3>{course.subjectName}</h3>
                    <span className="course-code">{course.courseCode}</span>
                  </div>

                  <div className="course-info">
                    {course.lecturerName && (
                      <p className="info-item">
                        <strong>Giảng viên:</strong> {course.lecturerName}
                      </p>
                    )}
                    {course.credits && (
                      <p className="info-item">
                        <strong>Tín chỉ:</strong> {course.credits}
                      </p>
                    )}
                    {course.schedules && course.schedules.length > 0 && (
                      <div className="info-item" style={{ marginTop: "8px", padding: "8px", backgroundColor: "rgba(99, 102, 241, 0.08)", borderRadius: "6px", border: "1px dashed rgba(99, 102, 241, 0.3)" }}>
                        <strong style={{ display: "block", marginBottom: "4px", color: "var(--primary)", fontSize: "0.88rem" }}>Lịch học & Phòng:</strong>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {course.schedules.map((s, idx) => (
                            <div key={idx} style={{ fontSize: "0.84rem", color: "var(--text-main)" }}>
                              • Thứ {s.dayOfWeek}: <b>{s.timeString || `Tiết ${s.startPeriod}-${s.endPeriod}`}</b> — <span style={{ color: "#10b981", fontWeight: 600 }}>{s.roomName || "Chưa gán P."}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="enrollment-status">
                      <Users size={16} />
                      <span>{course.studentCount || 0} sinh viên</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "2rem",
                }}
              >
                <button
                  onClick={() =>
                    fetchCourses(page - 1, searchQuery || undefined)
                  }
                  disabled={page === 0 || loading}
                  className="btn btn-secondary"
                >
                  Trước
                </button>
                <span style={{ padding: "0.5rem 1rem", alignSelf: "center" }}>
                  Trang {page + 1}/{totalPages}
                </span>
                <button
                  onClick={() =>
                    fetchCourses(page + 1, searchQuery || undefined)
                  }
                  disabled={page + 1 >= totalPages || loading}
                  className="btn btn-secondary"
                >
                  Tiếp
                </button>
              </div>
            )}

            <div className="action-buttons">
              <button
                onClick={handleEnroll}
                className="btn btn-primary"
                disabled={selectedCourses.length === 0 || enrolling}
              >
                {enrolling
                  ? "Đang đăng ký..."
                  : `Đăng Ký (${selectedCourses.length})`}
              </button>
              <button
                onClick={() => setSelectedCourses([])}
                className="btn btn-secondary"
                disabled={enrolling}
              >
                Hủy Chọn
              </button>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentEnroll;
