import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { BookOpen, Key, Mail, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (requireCaptcha && !captchaToken) {
      setError('Vui lòng hoàn thành xác thực CAPTCHA (Tôi không phải là người máy) bên dưới.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({ 
        email, 
        password, 
        captchaToken: captchaToken || undefined 
      });
      const { accessToken, token } = response.data;
      const finalToken = accessToken || token;
      
      login(finalToken);
      
      const base64Url = finalToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      const role = decoded.role.replace('ROLE_', '');

      if (role === 'ADMIN') {
        navigate("/admin/dashboard");
      } else if (role === 'TEACHER') {
        navigate('/teacher/courses');
      } else {
        navigate('/student/enroll');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      setError(errMsg);

      // Nếu server yêu cầu CAPTCHA hoặc thông báo lỗi liên quan đến số lần sai
      if (errMsg.includes('CAPTCHA') || errMsg.includes('người máy') || errMsg.includes('đăng nhập sai')) {
        setRequireCaptcha(true);
      }
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
        <p className="login-subtitle">Hệ Thống Đăng Ký Học Phần</p>

        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Địa chỉ Email
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
                type="email"
                className="form-control"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Mật khẩu
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
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none' }}>
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          {requireCaptcha && (
            <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
