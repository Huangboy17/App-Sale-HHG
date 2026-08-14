import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabaseClient';
import { AlertCircle, CheckCircle2, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, loading, logout } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(true);

  useEffect(() => {
    // Check if recovery session is valid or being established
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Listen to auth state changes for PASSWORD_RECOVERY event
        const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
          console.log('[ResetPassword] Auth event:', event);
          if (event === 'PASSWORD_RECOVERY' || s) {
            setHasValidSession(true);
          }
        });

        if (session) {
          setHasValidSession(true);
        } else {
          // If no immediate session, give it 1.5s in case hash fragment is parsing
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            setHasValidSession(!!retrySession);
            setIsCheckingSession(false);
          }, 1500);
          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error('[ResetPassword] Session check error:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 6) {
      setLocalError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp!');
      return;
    }

    const res = await updatePassword(password);
    if (res.success) {
      setIsSuccess(true);
      // Clean up recovery session so user logs in cleanly with new password
      try {
        await logout();
      } catch {
        // ignore
      }
    } else {
      setLocalError(res.error || 'Không thể đặt lại mật khẩu');
    }
  };

  if (isCheckingSession) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p className="text-muted">Đang kiểm tra liên kết đặt lại mật khẩu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary)',
              marginBottom: '1rem',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            ĐẶT LẠI MẬT KHẨU
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Nhập mật khẩu mới để bảo vệ tài khoản của bạn
          </p>
        </div>

        {localError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{localError}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: 'var(--success, #22c55e)',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={20} />
              <span>Đổi mật khẩu thành công!</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Mật khẩu mới của bạn đã được cập nhật an toàn trên hệ thống. Vui lòng đăng nhập lại để tiếp tục.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ĐĂNG NHẬP NGAY
            </button>
          </div>
        ) : !hasValidSession ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger, #ef4444)',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={20} style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Liên kết không hợp lệ hoặc đã hết hạn</div>
              <div style={{ color: 'var(--text-muted)' }}>
                Liên kết đặt lại mật khẩu chỉ sử dụng được 1 lần và có thời hạn. Vui lòng gửi lại yêu cầu mới.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ArrowLeft size={16} />
              QUAY LẠI ĐĂNG NHẬP
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Mật khẩu mới *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-muted">Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

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
              ĐỔI MẬT KHẨU
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ArrowLeft size={14} />
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
