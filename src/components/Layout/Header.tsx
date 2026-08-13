import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LogOut } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Quản lý Sản phẩm',
  '/customers': 'Quản lý Khách hàng',
  '/projects': 'Quản lý Dự án',
  '/opportunities': 'Cơ hội Bán hàng'
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const title = routeTitles[location.pathname] || 'Sales HHG';

  return (
    <header className="header glassmorphism">
      <div className="header-left">
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="header-right">
        <div className="user-profile-header">
          <span className="user-name-header">{user?.full_name || 'Người dùng'}</span>
          <span className="badge badge-primary role-badge">
            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
          </span>
        </div>
        <button onClick={logout} className="btn-icon btn-logout" title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
