import React from 'react';
import { NavLink } from 'react-router-dom';

import { useUiStore } from '../../stores/uiStore';
import * as Icons from 'lucide-react';

const MENU_GROUPS = [
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
      { path: '/products', label: 'Sản phẩm', icon: 'Package', implemented: true }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useUiStore();

  const renderIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={20} /> : <Icons.Circle size={20} />;
  };

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
        {MENU_GROUPS.map((group, groupIdx) => (
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
