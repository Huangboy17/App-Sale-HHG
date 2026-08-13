import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { NAV_ITEMS } from '../../lib/constants';
import * as Icons from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const renderIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={20} /> : <Icons.LayoutDashboard size={20} />;
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        {!sidebarCollapsed ? (
          <h1 className="logo-text gradient-text">Sales HHG</h1>
        ) : (
          <h1 className="logo-text gradient-text" style={{ fontSize: '1.5rem', textAlign: 'center', width: '100%' }}>S</h1>
        )}
        <button onClick={toggleSidebar} className="btn-icon sidebar-toggle">
          {sidebarCollapsed ? <Icons.ChevronRight size={18} /> : <Icons.ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          item.disabled ? (
            <div key={item.path} className="nav-item nav-item-disabled">
              <span className="nav-icon">{renderIcon(item.icon)}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  <span className="badge badge-sm badge-info nav-badge">Sắp ra mắt</span>
                </>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <span className="nav-icon">{renderIcon(item.icon)}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          )
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info-wrapper">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="user-details">
              <div className="user-name">{user?.name || 'Người dùng'}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
