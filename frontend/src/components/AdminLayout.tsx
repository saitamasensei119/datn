import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Building2,
  BookMarked,
  CalendarRange,
  GraduationCap,
  Users,
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

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    if (path.includes("/admin/dashboard")) return "Tổng Quan Hệ Thống";
    if (path.includes("/admin/departments")) return "Quản Lý Khoa / Ngành";
    if (path.includes("/admin/subjects")) return "Quản Lý Môn Học";
    if (path.includes("/admin/semesters")) return "Quản Lý Học Kỳ";
    if (path.includes("/admin/lecturers")) return "Quản Lý Giảng Viên";
    if (path.includes("/admin/students")) return "Quản Lý Sinh Viên";
    return "Hệ Thống Quản Lý";
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-brand">
          <BookOpen size={26} />
          <span>ADMIN PANEL</span>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <SidebarLink
              to="/admin/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Tổng Quan"
            />
            <li className="sidebar-divider">Quản Lý</li>
            <SidebarLink
              to="/admin/departments"
              icon={<Building2 size={20} />}
              label="Khoa / Ngành"
            />
            <SidebarLink
              to="/admin/subjects"
              icon={<BookMarked size={20} />}
              label="Môn Học"
            />
            <SidebarLink
              to="/admin/courses"
              icon={<BookMarked size={20} />}
              label="Khóa Học"
            />
            <SidebarLink
              to="/admin/semesters"
              icon={<CalendarRange size={20} />}
              label="Học Kỳ"
            />
            <SidebarLink
              to="/admin/lecturers"
              icon={<GraduationCap size={20} />}
              label="Giảng Viên"
            />
            <SidebarLink
              to="/admin/students"
              icon={<Users size={20} />}
              label="Sinh Viên"
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
            <h1 className="page-title">{getHeaderTitle()}</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.email}</span>
              <span className="badge badge-danger">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
