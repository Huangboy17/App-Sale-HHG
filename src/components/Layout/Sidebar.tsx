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
    label: 'BÁN HÀNG',
    items: [
      { path: '/opportunities', label: 'Cơ hội bán hàng', icon: 'Target', implemented: true },
      { path: '/quotations', label: 'Báo giá', icon: 'FileText', implemented: false },
      { path: '/orders', label: 'Đơn hàng', icon: 'ShoppingCart', implemented: false }
    ]
  },
  {
    label: 'KHÁCH HÀNG',
    items: [
      { path: '/customers', label: 'Khách hàng', icon: 'Users', implemented: true },
      { path: '/projects', label: 'Dự án', icon: 'FolderKanban', implemented: true }
    ]
  },
  {
    label: 'THỰC HIỆN',
    items: [
      { path: '/contracts', label: 'Hợp đồng', icon: 'FileSignature', implemented: false },
      { path: '/procurement', label: 'Đặt hàng/Hải quan', icon: 'Ship', implemented: false },
      { path: '/deliveries', label: 'Giao hàng', icon: 'Truck', implemented: false },
      { path: '/payments', label: 'Thanh toán', icon: 'CreditCard', implemented: false }
    ]
  },
  {
    label: 'KHO & SẢN PHẨM',
    items: [
      { path: '/products', label: 'Sản phẩm', icon: 'Package', implemented: true },
      { path: '/inventory', label: 'Tồn kho', icon: 'Warehouse', implemented: false }
    ]
  },
  {
    label: 'BÁO CÁO',
    items: [
      { path: '/reports/sales', label: 'Doanh số', icon: 'BarChart2', implemented: false },
      { path: '/reports/pipeline', label: 'Pipeline', icon: 'PieChart', implemented: false },
      { path: '/reports/performance', label: 'Hiệu quả Sale', icon: 'TrendingUp', implemented: false },
      { path: '/reports/lost', label: 'Khách mất', icon: 'UserMinus', implemented: false }
    ]
  },
  {
    label: 'QUẢN TRỊ',
    items: [
      { path: '/admin/import', label: 'Import Data', icon: 'Upload', implemented: false },
      { path: '/admin/settings', label: 'Cấu hình', icon: 'Settings', implemented: false }
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
