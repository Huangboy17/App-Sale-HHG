import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import type { Customer, CustomerStatus } from '../../lib/types';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, CUSTOMER_SOURCES } from '../../lib/constants';
import CustomerForm from './CustomerForm';
import CustomerDetailModal from './CustomerDetailModal';

export default function CustomerList() {
  const { customers, loading, loadCustomers, setSearchQuery, searchQuery, filters, setFilters } = useCustomerStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const columns = [
    { label: 'Tên KH', key: 'customer_name', sortable: true },
    { label: 'Công ty', key: 'company_name', sortable: true },
    { label: 'SĐT', key: 'phone' },
    { label: 'Người liên hệ', key: 'contact_person' },
    { 
      label: 'Tình trạng', 
      key: 'status',
      render: (val: unknown) => (
        <StatusBadge 
          status={val as string} 
          labels={CUSTOMER_STATUS_LABELS} 
          colors={CUSTOMER_STATUS_COLORS} 
        />
      )
    },
    { 
      label: 'Ngày cập nhật', 
      key: 'updated_at',
      render: (val: unknown) => {
        if (!val) return '-';
        return new Date(val as string).toLocaleDateString('vi-VN');
      }
    }
  ];

  const handleRowClick = (row: Customer) => {
    setSelectedCustomer(row);
    setIsDetailOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Khách hàng</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={20} />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: '1', minWidth: '250px' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên KH, công ty, SĐT..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: (e.target.value as CustomerStatus) || undefined })}
          >
            <option value="">Tất cả tình trạng</option>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filters.source || ''}
            onChange={(e) => setFilters({ source: e.target.value || undefined })}
          >
            <option value="">Tất cả nguồn</option>
            {CUSTOMER_SOURCES.map((src) => (
              <option key={src.value} value={src.value}>{src.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card data-table-wrapper">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            onRowClick={handleRowClick}
            emptyMessage="Không tìm thấy khách hàng nào"
          />
        )}
      </div>

      {isFormOpen && (
        <CustomerForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          customer={selectedCustomer}
        />
      )}

      {isDetailOpen && selectedCustomer && (
        <CustomerDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          customer={selectedCustomer}
          onEdit={() => handleEditClick(selectedCustomer)}
        />
      )}
    </div>
  );
}
