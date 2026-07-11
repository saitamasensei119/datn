import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Book,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  BarChart3,
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

const TeacherLayout: React.FC<{ children: React.ReactNode }> = ({
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
          <span>TEACHER</span>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <SidebarLink
              to="/teacher/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Tổng Quan"
            />
            <li className="sidebar-divider">Giảng Dạy</li>
            <SidebarLink
              to="/teacher/courses"
              icon={<Book size={20} />}
              label="Lớp Học Phần"
            />
            <SidebarLink
              to="/teacher/grades"
              icon={<ClipboardList size={20} />}
              label="Nhập Điểm"
            />
            <SidebarLink
              to="/teacher/attendance"
              icon={<BarChart3 size={20} />}
              label="Điểm Danh"
            />
            <li className="sidebar-divider">Cá Nhân</li>
            <SidebarLink
              to="/teacher/profile"
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

export default TeacherLayout;
