import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import * as Icons from 'lucide-react';

const REGULAR_MENU_GROUPS = [
  {
    label: 'TỔNG QUAN',
    items: [
      { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', implemented: true }
    ]
  },
  {
    label: 'KHÁCH HÀNG',
    items: [
      { path: '/customers', label: 'Khách hàng', icon: 'Users', implemented: true }
    ]
  },
  {
    label: 'SẢN PHẨM',
    items: [
      { path: '/products', label: 'Sản phẩm & Tồn kho', icon: 'Package', implemented: true }
    ]
  }
];

const LEVEL_1_MENU_GROUPS = [
  ...REGULAR_MENU_GROUPS,
  {
    label: 'TỔ CHỨC',
    items: [
      { path: '/members', label: 'Thành viên', icon: 'Users', implemented: true }
    ]
  }
];

const ADMIN_MENU_GROUPS = [
  {
    label: 'HỆ THỐNG',
    items: [
      { path: '/admin', label: 'Quản trị hệ thống', icon: 'Settings', implemented: true }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useUiStore();
  const { user } = useAuthStore();

  const renderIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={20} /> : <Icons.Circle size={20} />;
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isLevel1 = user?.role === 'LEVEL_1';
  
  const displayGroups = isSuperAdmin 
    ? ADMIN_MENU_GROUPS 
    : (isLevel1 ? LEVEL_1_MENU_GROUPS : REGULAR_MENU_GROUPS);

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!sidebarCollapsed ? (
          <span>SALES PRO</span>
        ) : (
          <span>SP</span>
        )}
      </div>

      <nav className="sidebar-nav">
        {displayGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {!sidebarCollapsed && <div className="sidebar-group-label">{group.label}</div>}
            {group.items.map((item) => {
              if (!item.implemented) {
                return (
                  <div key={item.path} className="sidebar-nav-item" style={{ opacity: 0.6 }}>
                    {renderIcon(item.icon)}
                    {!sidebarCollapsed && (
                      <div className="flex items-center justify-between" style={{ width: '100%' }}>
                        <span>{item.label}</span>
                        <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>Sắp ra mắt</span>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  {renderIcon(item.icon)}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
