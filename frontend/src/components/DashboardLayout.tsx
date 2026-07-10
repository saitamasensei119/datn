import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import { 
  BookOpen, 
  Building2, 
  BookMarked, 
  CalendarRange, 
  GraduationCap, 
  Users, 
  Presentation, 
  LogOut, 
  Sun, 
  Moon, 
  CheckSquare 
} from 'lucide-react';

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
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Title of the page based on active route
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes('/departments')) return 'Quản Lý Khoa / Ngành';
    if (path.includes('/subjects')) return 'Quản Lý Môn Học';
    if (path.includes('/semesters')) return 'Quản Lý Học Kỳ';
    if (path.includes('/lecturers')) return 'Quản Lý Giảng Viên';
    if (path.includes('/students')) return 'Quản Lý Sinh Viên';
    if (path.includes('/courses')) return 'Quản Lý Lớp Học Phần';
    if (path.includes('/student/enroll')) return 'Đăng Ký Học Phần';
    if (path.includes('/student/my-enrollments')) return 'Kết Quả Đăng Ký';
    if (path.includes('/teacher/courses')) return 'Lớp Học Phần Giảng Dạy';
    return 'Hệ Thống Đăng Ký Học Phần';
  };

  const renderRoleBadge = () => {
    switch (user.role) {
      case 'ADMIN':
        return <span className="badge badge-danger">ADMIN</span>;
      case 'TEACHER':
        return <span className="badge badge-warning">GIẢNG VIÊN</span>;
      case 'STUDENT':
        return <span className="badge badge-success">SINH VIÊN</span>;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BookOpen size={26} />
          <span>COURSE ENROLL</span>
        </div>

        <nav style={{ flexGrow: 1, overflowY: 'auto' }}>
          <ul className="sidebar-menu">
            {user.role === 'ADMIN' && (
              <>
                <SidebarLink to="/admin/departments" icon={<Building2 size={20} />} label="Quản lý Khoa" />
                <SidebarLink to="/admin/subjects" icon={<BookMarked size={20} />} label="Quản lý Môn học" />
                <SidebarLink to="/admin/semesters" icon={<CalendarRange size={20} />} label="Quản lý Học kỳ" />
                <SidebarLink to="/admin/lecturers" icon={<Users size={20} />} label="Quản lý Giảng viên" />
                <SidebarLink to="/admin/students" icon={<GraduationCap size={20} />} label="Quản lý Sinh viên" />
                <SidebarLink to="/admin/courses" icon={<Presentation size={20} />} label="Quản lý Lớp học phần" />
              </>
            )}

            {user.role === 'STUDENT' && (
              <>
                <SidebarLink to="/student/enroll" icon={<BookMarked size={20} />} label="Đăng ký học phần" />
                <SidebarLink to="/student/my-enrollments" icon={<CheckSquare size={20} />} label="Kết quả đăng ký" />
              </>
            )}

            {user.role === 'TEACHER' && (
              <>
                <SidebarLink to="/teacher/courses" icon={<Presentation size={20} />} label="Lớp đang giảng dạy" />
              </>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
            <LogOut size={20} style={{ color: 'var(--danger)' }} />
            <span style={{ color: 'var(--danger)' }}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="main-header">
          <h1 className="header-title" style={{ margin: 0, fontSize: '1.25rem', letterSpacing: 'normal' }}>
            {getHeaderTitle()}
          </h1>

          <div className="header-actions">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="btn-icon-only" 
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile badge */}
            <div
              className="user-profile-badge"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setIsProfileOpen(true)}
              title="Cài đặt tài khoản / Đổi mật khẩu & Avatar"
            >
              <div className="avatar">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  user.email.charAt(0).toUpperCase()
                )}
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
              {renderRoleBadge()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="main-content">
          {children}
        </main>
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </div>
    </div>
  );
};

export default DashboardLayout;
