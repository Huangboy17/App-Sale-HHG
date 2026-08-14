import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/database';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginByEmail } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      let user = db.getUserByEmail(email);
      if (!user) {
        user = db.createUser({ full_name: email.split('@')[0], email, role: 'SALE' });
      }
      loginByEmail(email);
      navigate('/');
    } else {
      if (password !== confirmPassword) {
        alert("Mật khẩu không khớp!");
        return;
      }
      let user = db.getUserByEmail(email);
      if (user) {
        alert("Email đã được sử dụng!");
        return;
      }
      db.createUser({ full_name: fullName, email, role: 'SALE' });
      loginByEmail(email);
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>SALES PRO</h2>
          <p className="text-muted">Hệ thống Quản lý Bán hàng</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Họ tên</label>
              <input
                type="text"
                required
                className="form-control"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-muted">Tên đăng nhập / Email</label>
            <input
              type="email"
              required
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-muted">Mật khẩu</label>
            <input
              type="password"
              required
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                className="form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
            {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
