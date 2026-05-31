import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  BookMarked,
  CheckCircle,
  FileText,
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
} from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
};

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes("/student/dashboard")) return "Tổng Quan Sinh Viên";
    if (path.includes("/student/enroll")) return "Đăng Ký Học Phần";
    if (path.includes("/student/my-courses")) return "Lớp Học Phần của Tôi";
    if (path.includes("/student/my-grades")) return "Kết Quả Học Tập";
    if (path.includes("/student/transcript")) return "Bảng Điểm";
    return "Trang Chủ Sinh Viên";
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-brand">
          <BookOpen size={26} />
          <span>STUDENT</span>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <SidebarLink
              to="/student/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Tổng Quan"
            />
            <li className="sidebar-divider">Học Tập</li>
            <SidebarLink
              to="/student/enroll"
              icon={<BookMarked size={20} />}
              label="Đăng Ký Học Phần"
            />
            <SidebarLink
              to="/student/my-courses"
              icon={<BookOpen size={20} />}
              label="Lớp Học Phần của Tôi"
            />
            <SidebarLink
              to="/student/my-grades"
              icon={<CheckCircle size={20} />}
              label="Kết Quả Học Tập"
            />
            <SidebarLink
              to="/student/transcript"
              icon={<FileText size={20} />}
              label="Bảng Điểm"
            />
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-btn" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === "dark" ? "Sáng" : "Tối"}</span>
          </button>
          <button className="sidebar-btn logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="page-title">{getHeaderTitle()}</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.email}</span>
              <span className="badge badge-success">SINH VIÊN</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
};

export default StudentLayout;
