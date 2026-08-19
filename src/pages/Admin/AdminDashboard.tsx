import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, ShieldAlert, Search, X, Lock, Unlock } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { User, AccountStatus } from '../../lib/types';
import { useAuthStore } from '../../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [limitToSet, setLimitToSet] = useState(5);

  useEffect(() => {
    if (selectedProfile) {
      setLimitToSet(selectedProfile.level_2_limit || selectedProfile.max_members || 5);
    }
  }, [selectedProfile]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await adminService.fetchAllProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: AccountStatus, extra?: { level_2_limit?: number }) => {
    try {
      // Pass extra to updateProfileStatus if supported, otherwise you'd need a separate call
      // We will update adminService.updateProfileStatus to accept extra
      await adminService.updateProfileStatus(id, status, extra);
      await fetchProfiles();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const level1Users = profiles.filter(p => p.role === 'LEVEL_1');
  const getSubCount = (parentId: string) => profiles.filter(p => p.parent_id === parentId).length;

  const filteredUsers = level1Users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = {
    total: level1Users.length,
    active: level1Users.filter(u => u.status === 'ACTIVE' || u.account_status === 'active').length,
    pending: level1Users.filter(u => u.status === 'PENDING' || u.account_status === 'pending').length,
    blocked: level1Users.filter(u => u.status === 'SUSPENDED' || u.status === 'REJECTED' || u.account_status === 'blocked').length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl">Quản trị hệ thống</h1>
          <p className="text-sm text-muted">Quản lý tài khoản Khách hàng (Level 1)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="shrink-0 flex gap-4 mb-4">
        <div className="kpi-card flex-1 flex items-center gap-4 py-3 px-4">
          <div className="p-2 rounded-full" style={{ background: 'var(--primary-light, rgba(22,119,255,0.1))', color: 'var(--primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="kpi-title mb-0">Tổng số</div>
            <div className="text-xl font-bold">{kpis.total}</div>
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
          <div className="p-2 rounded-full" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <UserPlus size={20} />
          </div>
          <div>
            <div className="kpi-title mb-0">Chờ duyệt</div>
            <div className="text-xl font-bold">{kpis.pending}</div>
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
            placeholder="Tìm kiếm..." 
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
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Hạn mức (Level 2)</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">Không có dữ liệu</td></tr>
              ) : (
                filteredUsers.map(profile => {
                  const subCount = getSubCount(profile.id);
                  const status = profile.account_status || (profile.is_active ? 'active' : 'blocked');
                  return (
                    <tr 
                      key={profile.id} 
                      className="cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{profile.full_name}</div>
                            <div className="text-[11px] text-muted">{profile.id.slice(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="text-[13px]">{profile.email}</div>
                        {profile.phone && <div className="text-[11px] text-muted">{profile.phone}</div>}
                      </td>
                      <td className="py-2">
                        <div className="text-[13px]">
                          {subCount} / {profile.level_2_limit || profile.max_members || 5}
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1" style={{ maxWidth: '100px' }}>
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (subCount / (profile.level_2_limit || profile.max_members || 5)) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2">
                        {(status === 'ACTIVE' || status === 'active') && <span className="badge badge-success text-[11px]">Hoạt động</span>}
                        {(status === 'PENDING' || status === 'pending') && <span className="badge badge-warning text-[11px]">Chờ duyệt</span>}
                        {(status === 'SUSPENDED' || status === 'blocked') && <span className="badge badge-danger text-[11px]">Đã khóa</span>}
                        {(status === 'REJECTED') && <span className="badge badge-danger text-[11px]">Từ chối</span>}
                        {(status === 'archived') && <span className="badge badge-default text-[11px]">Đã xóa</span>}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {status === 'pending' || status === 'PENDING' ? (
                            <>
                              <button 
                                className="btn btn-primary py-1 px-2 text-xs"
                                onClick={() => setSelectedProfile(profile)}
                              >Duyệt / Từ chối</button>
                            </>
                          ) : (
                            <select 
                              className="bg-transparent border border-gray-600 rounded text-sm p-1 outline-none cursor-pointer"
                              value={status === 'ACTIVE' || status === 'active' ? 'active' : status === 'SUSPENDED' || status === 'blocked' ? 'blocked' : status}
                              onChange={(e) => updateStatus(profile.id, e.target.value as AccountStatus)}
                            >
                              <option value="active" className="text-black">Hoạt động</option>
                              <option value="blocked" className="text-black">Khóa</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProfile && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '1.5rem' }}>
          <div className="modal-container modal-lg flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)', height: '80vh' }}>
            <div className="modal-header shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg">
                  {selectedProfile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-title">{selectedProfile.full_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="badge badge-info text-[10px]">CẤP 1</span>
                    <span className="badge badge-default text-[10px]">{selectedProfile.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn-icon"
                  onClick={() => updateStatus(selectedProfile.id, selectedProfile.account_status === 'blocked' ? 'active' : 'blocked')}
                  title={selectedProfile.account_status === 'blocked' ? "Mở khóa" : "Khóa tài khoản"}
                >
                  {selectedProfile.account_status === 'blocked' ? <Unlock size={18} /> : <Lock size={18} />}
                </button>
                <button className="btn-icon" onClick={() => setSelectedProfile(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col p-4 bg-[var(--bg-body)]">
              {/* Info & KPI Grid */}
              <div className="shrink-0 grid grid-cols-3 gap-4 mb-4">
                <div className="card p-3">
                  <div className="text-xs text-muted mb-1">Hạn mức thành viên (Level 2)</div>
                  {selectedProfile.status === 'PENDING' || selectedProfile.account_status === 'pending' ? (
                    <input 
                      type="number" 
                      min={0}
                      className="form-input mt-1 w-24" 
                      value={limitToSet}
                      onChange={e => setLimitToSet(Number(e.target.value))}
                    />
                  ) : (
                    <div className="text-lg font-bold">{getSubCount(selectedProfile.id)} / {selectedProfile.level_2_limit || selectedProfile.max_members || 5}</div>
                  )}
                </div>
                <div className="card p-3">
                  <div className="text-xs text-muted mb-1">Trạng thái</div>
                  <div className="text-lg font-bold capitalize">{selectedProfile.status || selectedProfile.account_status || 'active'}</div>
                </div>
                <div className="card p-3">
                  <div className="text-xs text-muted mb-1">Ngày tạo</div>
                  <div className="text-sm font-bold mt-1">{new Date(selectedProfile.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {(selectedProfile.status === 'PENDING' || selectedProfile.account_status === 'pending') && (
                <div className="shrink-0 flex gap-3 mb-4">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      updateStatus(selectedProfile.id, 'ACTIVE', { level_2_limit: limitToSet });
                      setSelectedProfile(null);
                    }}
                  >Phê duyệt & Lưu</button>
                  <button 
                    className="btn btn-default text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => {
                      updateStatus(selectedProfile.id, 'REJECTED');
                      setSelectedProfile(null);
                    }}
                  >Từ chối</button>
                </div>
              )}

              {/* Members List */}
              <div className="flex-1 min-h-0 flex flex-col card p-0 overflow-hidden border-t">
                <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-surface-light)] shrink-0 flex justify-between items-center">
                  <h4 className="font-medium text-sm m-0">Danh sách thành viên (Level 2)</h4>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.filter(p => p.parent_id === selectedProfile.id).length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-muted">Chưa có thành viên nào</td></tr>
                      ) : (
                        profiles.filter(p => p.parent_id === selectedProfile.id).map(member => (
                          <tr key={member.id}>
                            <td className="py-2 text-[13px]">{member.full_name}</td>
                            <td className="py-2 text-[13px] text-muted">{member.email}</td>
                            <td className="py-2"><span className="badge badge-default text-[10px]">{member.role}</span></td>
                            <td className="py-2">
                              {member.account_status === 'active' || member.is_active ? 
                                <span className="text-success text-[12px]">● Hoạt động</span> : 
                                <span className="text-danger text-[12px]">● Đã khóa</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
