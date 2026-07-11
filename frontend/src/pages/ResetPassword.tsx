import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { BookOpen, Key, Hash, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(typeof response.data === 'string' ? response.data : 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.response?.data || 'Đặt lại mật khẩu thất bại. Mã OTP có thể đã hết hạn hoặc không hợp lệ.'
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
        <p className="login-subtitle">Đặt Lại Mật Khẩu</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Vui lòng nhập Mã OTP 6 chữ số vừa nhận được và mật khẩu mới của bạn.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '1rem', backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '4px' }}>
            <span>{success} Đang chuyển đến trang đăng nhập...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="token">
              Mã xác thực OTP (6 chữ số)
            </label>
            <div style={{ position: 'relative' }}>
              <Hash 
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
                id="token"
                type="text"
                className="form-control"
                placeholder="Ví dụ: 849201"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ paddingLeft: '2.5rem', letterSpacing: '2px', fontWeight: 'bold' }}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              Mật khẩu mới
            </label>
            <div style={{ position: 'relative' }}>
              <Key 
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
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Xác nhận mật khẩu mới
            </label>
            <div style={{ position: 'relative' }}>
              <Key 
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
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={isLoading || !token || !newPassword}
          >
            {isLoading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : 'Xác Nhận Đặt Lại Mật Khẩu'}
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

export default ResetPassword;
