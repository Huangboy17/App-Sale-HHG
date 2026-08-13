import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Opportunity, User } from '../../lib/types';
import { formatVND, formatDate } from '../../lib/formatters';
import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../lib/constants';
import { db } from '../../lib/database';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import OpportunityForm from './OpportunityForm';

export default function OpportunityList() {
  const navigate = useNavigate();
  const { opportunities, loading, loadOpportunities } = useOpportunityStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { projects, loadProjects } = useProjectStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSale, setFilterSale] = useState('');

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
    loadProjects();
    const fetchUsers = async () => {
      const allUsers = await db.getUsers();
      setUsers(allUsers);
    };
    fetchUsers();
  }, [loadOpportunities, loadCustomers, loadProjects]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      const searchLower = searchTerm.toLowerCase();
      const customerName = customers.find(c => c.id === o.customer_id)?.customer_name || '';
      
      const matchSearch = 
        o.opportunity_code.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower);
        
      const matchStatus = filterStatus ? o.status === filterStatus : true;
      const matchPriority = filterPriority ? o.priority === filterPriority : true;
      const matchSale = filterSale ? o.assigned_sale_id === filterSale : true;
      
      return matchSearch && matchStatus && matchPriority && matchSale;
    });
  }, [opportunities, customers, searchTerm, filterStatus, filterPriority, filterSale]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<string, number>;
    opportunities.forEach((o: Opportunity) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [opportunities]);

  const columns = [
    { 
      label: 'Mã', 
      key: 'opportunity_code' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => <span className="font-semibold text-blue-600">{o.opportunity_code}</span>
    },
    { 
      label: 'Khách hàng', 
      key: 'customer_id' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => customers.find(c => c.id === o.customer_id)?.customer_name || '-'
    },
    { 
      label: 'Dự án', 
      key: 'project_id' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => {
        if (!o.project_id) return '-';
        return projects.find(p => p.id === o.project_id)?.project_name || '-';
      }
    },
    { 
      label: 'Sale', 
      key: 'assigned_sale_id' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => users.find(u => u.id === o.assigned_sale_id)?.full_name || '-'
    },
    { 
      label: 'Ngày tiếp nhận', 
      key: 'received_date' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => formatDate(o.received_date)
    },
    { 
      label: 'Giá trị dự kiến', 
      key: 'estimated_value' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => formatVND(o.estimated_value || 0)
    },
    { 
      label: 'Ưu tiên', 
      key: 'priority' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${PRIORITY_COLORS[o.priority]}-100 text-${PRIORITY_COLORS[o.priority]}-800`}>
          {PRIORITY_LABELS[o.priority]}
        </span>
      )
    },
    { 
      label: 'Trạng thái', 
      key: 'status' as keyof Opportunity,
      render: (_val: unknown, o: Opportunity) => (
        <StatusBadge 
          status={o.status} 
          labels={OPPORTUNITY_STATUS_LABELS} 
          colors={OPPORTUNITY_STATUS_COLORS} 
        />
      )
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Cơ hội Bán hàng</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          <Plus size={20} className="mr-2" />
          Tạo cơ hội
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!filterStatus ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setFilterStatus('')}
        >
          Tất cả ({opportunities.length})
        </button>
        {Object.entries(OPPORTUNITY_STATUS_LABELS).map(([status, label]) => (
          <button 
            key={status}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setFilterStatus(status)}
          >
            {label} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      <div className="filter-bar card">
        <div className="search-box w-full max-w-sm">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã cơ hội, tên KH..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="form-input"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">Tất cả mức độ</option>
          {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        
        <select 
          className="form-input"
          value={filterSale}
          onChange={(e) => setFilterSale(e.target.value)}
        >
          <option value="">Tất cả Sale</option>
          {users.filter(u => u.role === 'SALE' || u.role === 'MANAGER').map(u => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading && <div className="text-gray-500 mb-4">Đang tải...</div>}
        <DataTable
          columns={columns}
          data={filteredOpportunities}
          onRowClick={(o) => navigate(`/opportunities/${o.id}`)}
        />
      </div>

      {isFormOpen && (
        <OpportunityForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
