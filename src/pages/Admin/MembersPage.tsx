import React, { useEffect, useState } from 'react';
import { Users, UserCheck, ShieldAlert, Search, Lock, Unlock } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { User, AccountStatus } from '../../lib/types';
import { useAuthStore } from '../../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function MembersPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await adminService.fetchAllProfiles();
      setMembers(data.filter(p => p.parent_id === user.id));
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: AccountStatus) => {
    try {
      await adminService.updateProfileStatus(id, status);
      await fetchMembers();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (user?.role !== 'LEVEL_1') {
    return <Navigate to="/" replace />;
  }

  const filteredMembers = members.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = {
    total: members.length,
    active: members.filter(u => u.account_status === 'active' || u.is_active).length,
    blocked: members.filter(u => u.account_status === 'blocked').length,
    quota: user.max_members || 5,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl">Quản lý thành viên</h1>
          <p className="text-sm text-muted">Quản lý tài khoản nhân viên (Level 2)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="shrink-0 flex gap-4 mb-4">
        <div className="kpi-card flex-1 flex items-center gap-4 py-3 px-4">
          <div className="p-2 rounded-full" style={{ background: 'var(--primary-light, rgba(22,119,255,0.1))', color: 'var(--primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="kpi-title mb-0">Thành viên / Hạn mức</div>
            <div className="text-xl font-bold">{kpis.total} / {kpis.quota}</div>
          </div>
        </div>
        <div className="kpi-card flex-1 flex items-center gap-4 py-3 px-4">
          <div className="p-2 rounded-full" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div className="kpi-title mb-0">Đang hoạt động</div>
            <div className="text-xl font-bold">{kpis.active}</div>
          </div>
        </div>
        <div className="kpi-card flex-1 flex items-center gap-4 py-3 px-4">
          <div className="p-2 rounded-full" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="kpi-title mb-0">Đã khóa</div>
            <div className="text-xl font-bold">{kpis.blocked}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between mb-4">
        <div className="search-box w-64">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Tìm kiếm thành viên..." 
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 data-table-wrapper flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="data-table w-full relative">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Thành viên</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Đang tải...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Không có dữ liệu</td></tr>
              ) : (
                filteredMembers.map(member => {
                  const status = member.account_status || (member.is_active ? 'active' : 'blocked');
                  return (
                    <tr key={member.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">
                            {member.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{member.full_name}</div>
                            <div className="text-[11px] text-muted">{member.id.slice(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="text-[13px]">{member.email}</div>
                        {member.phone && <div className="text-[11px] text-muted">{member.phone}</div>}
                      </td>
                      <td className="py-2 text-[13px]">{member.role}</td>
                      <td className="py-2">
                        {status === 'active' && <span className="badge badge-success text-[11px]">Hoạt động</span>}
                        {status === 'pending' && <span className="badge badge-warning text-[11px]">Chờ duyệt</span>}
                        {status === 'blocked' && <span className="badge badge-danger text-[11px]">Đã khóa</span>}
                        {status === 'archived' && <span className="badge badge-default text-[11px]">Đã xóa</span>}
                      </td>
                      <td className="py-2 text-right">
                        <button 
                          className="btn-icon"
                          onClick={() => updateStatus(member.id, status === 'blocked' ? 'active' : 'blocked')}
                          title={status === 'blocked' ? "Mở khóa" : "Khóa tài khoản"}
                        >
                          {status === 'blocked' ? <Unlock size={18} className="text-success" /> : <Lock size={18} className="text-danger" />}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
