import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  UserCheck,
  ListPlus,
  User,
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, _setSidebarOpen] = useState(true);

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


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-brand">
          <BookOpen size={26} />
          <span>STUDENT</span>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <SidebarLink
              to="/student/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Tổng Quan"
            />
            <li className="sidebar-divider">Học Tập</li>
            <SidebarLink
              to="/student/pre-registration"
              icon={<ListPlus size={20} />}
              label="Đăng Ký Nguyện Vọng"
            />
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
              to="/student/attendance"
              icon={<UserCheck size={20} />}
              label="Điểm Danh"
            />
            <SidebarLink
              to="/student/transcript"
              icon={<FileText size={20} />}
              label="Bảng Điểm"
            />
            <li className="sidebar-divider">Cá Nhân</li>
            <SidebarLink
              to="/student/profile"
              icon={<User size={20} />}
              label="Hồ Sơ Của Tôi"
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
        {/* Content Area */}
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
};

export default StudentLayout;
