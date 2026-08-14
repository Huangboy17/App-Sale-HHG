import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ROLE_LABELS } from '../../lib/constants';
import { LogOut, Search, Bell, User, Building2 } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Sản phẩm & Tồn kho',
  '/customers': 'Khách hàng',
  '/projects': 'Dự án',
  '/opportunities': 'Cơ hội Bán hàng',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, organization, logout } = useAuthStore();

  const title = routeTitles[location.pathname] || 'SALES PRO';
  const roleLabel = user?.role ? (ROLE_LABELS as any)[user.role] || user.role : 'Nhân viên';

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="flex items-center" style={{ flex: 1, justifyContent: 'center', padding: '0 2rem' }}>
        <div className="form-control" style={{ maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%' }}
          />
        </div>
      </div>

      <div className="header-right">
        {organization && (
          <div
            className="flex items-center gap-1"
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md, 6px)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--primary, #3b82f6)',
            }}
          >
            <Building2 size={14} />
            <span>{organization.name}</span>
          </div>
        )}

        <button className="btn-icon">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name || 'Admin User'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleLabel}</div>
          </div>
          <button className="btn-icon" style={{ background: 'var(--primary-light)' }}>
            <User size={20} />
          </button>
          <button onClick={logout} className="btn-icon text-danger" title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
