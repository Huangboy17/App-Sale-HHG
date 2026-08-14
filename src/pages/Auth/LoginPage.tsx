import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, loading, error, clearError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (isLogin) {
      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/');
      } else {
        setLocalError(res.error || 'Đăng nhập không thành công');
      }
    } else {
      if (password !== confirmPassword) {
        setLocalError('Mật khẩu xác nhận không khớp!');
        return;
      }
      if (password.length < 6) {
        setLocalError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
      }

      const res = await signup(email.trim(), password, fullName.trim(), 'SALE');
      if (res.success) {
        if (useAuthStore.getState().isAuthenticated) {
          navigate('/');
        } else {
          setSuccessMessage(res.error || 'Đăng ký thành công!');
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        setLocalError(res.error || 'Đăng ký không thành công');
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            SALES PRO
          </h2>
          <p className="text-muted">Hệ thống Quản lý Bán hàng HHG Holdings</p>
        </div>

        {displayError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: 'var(--success, #22c55e)',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Họ tên *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-muted">Tên đăng nhập / Email *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="user@hhg.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-muted">Mật khẩu *</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Xác nhận mật khẩu *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '1rem',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={toggleMode}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
