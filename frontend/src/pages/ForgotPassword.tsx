import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { BookOpen, Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(typeof response.data === 'string' ? response.data : 'Hướng dẫn khôi phục mật khẩu đã được gửi đi.');
      // Tự động chuyển hướng sang trang reset sau 2 giây
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra. Vui lòng kiểm tra lại email hoặc thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <BookOpen size={32} />
          <span>COURSE ENROLL</span>
        </div>
        <p className="login-subtitle">Khôi Phục Mật Khẩu</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Nhập địa chỉ Email trường cấp (`@sv.edu.vn`) của bạn. Mã xác thực OTP 6 số sẽ được gửi tới <b>Email cá nhân</b> mà bạn đã đăng ký.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '1rem', backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '4px' }}>
            <span>{message} Đang chuyển đến trang nhập mã OTP...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Địa chỉ Email trường cấp
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                id="email"
                type="text"
                className="form-control"
                placeholder="email@sv.edu.vn hoặc Mã sinh viên"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : 'Gửi Mã OTP Khôi Phục'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Quay lại Đăng Nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
