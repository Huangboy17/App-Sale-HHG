import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, CUSTOMER_SOURCES,
  SALE_QUOTATION_STATUS_LABELS, SALE_QUOTATION_STATUS_COLORS 
} from '../../lib/constants';
import type { Customer, CustomerStatus, User, SaleQuotation } from '../../lib/types';
import { useCustomerStore } from '../../stores/customerStore';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { db } from '../../lib/database';
import { formatVND, formatDate as fmtDate } from '../../lib/formatters';
import { Edit2, Save, Plus, FileText } from 'lucide-react';
import QuotationFormModal from '../Quotations/QuotationFormModal';
import QuotationDetailModal from '../Quotations/QuotationDetailModal';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit: () => void;
}

export default function CustomerDetailModal({ isOpen, onClose, customer, onEdit }: CustomerDetailModalProps) {
  const { updateStatus, loadCustomers } = useCustomerStore();
  const { quotations, loadByCustomer } = useSaleQuotationStore();
  const [status, setStatus] = useState<CustomerStatus>(customer.status);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<SaleQuotation | null>(null);

  useEffect(() => {
    setStatus(customer.status);
    const users = db.getUsers();
    setSalesUsers(users);
    loadByCustomer(customer.id);
  }, [customer, loadByCustomer]);

  const handleUpdateStatus = () => {
    if (status !== customer.status) {
      updateStatus(customer.id, status);
    }
  };

  const getSourceName = (val?: string) => {
    return CUSTOMER_SOURCES.find(s => s.value === val)?.label || val || 'Chưa xác định';
  };

  const getSaleName = (id?: string) => {
    if (!id) return 'Chưa phân công';
    return salesUsers.find(u => u.id === id)?.full_name || 'Không tìm thấy sale';
  };

  const handleQuotationSaved = () => {
    loadByCustomer(customer.id);
    setShowQuotationForm(false);
  };

  const handleQuotationStatusUpdated = () => {
    loadByCustomer(customer.id);
  };

  // Compact info display
  const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value || <span style={{ color: 'var(--text-muted)' }}>–</span>}</div>
    </div>
  );

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    textAlign: 'left',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid var(--border-color)',
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="xl"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>{customer.customer_name}</span>
            <StatusBadge 
              status={customer.status} 
              labels={CUSTOMER_STATUS_LABELS} 
              colors={CUSTOMER_STATUS_COLORS} 
            />
          </div> as unknown as string
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={onEdit}>
              <Edit2 size={16} /> Sửa thông tin
            </button>
          </div>
        }
      >
        {/* ============ THÔNG TIN KHÁCH HÀNG – Compact Grid ============ */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }}>
            <InfoItem label="Tên khách hàng" value={customer.customer_name} />
            <InfoItem label="Công ty" value={customer.company_name} />
            <InfoItem label="Người liên hệ" value={customer.contact_person} />
            <InfoItem label="Số điện thoại" value={customer.phone} />
            <InfoItem label="Email" value={customer.email} />
            <InfoItem label="Mã số thuế" value={customer.tax_code} />
            <InfoItem label="Địa chỉ" value={customer.address} />
            <InfoItem label="Nguồn" value={getSourceName(customer.source)} />
            <InfoItem label="Phụ trách" value={getSaleName(customer.assigned_sale_id)} />
          </div>
          {customer.notes && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <InfoItem label="Ghi chú" value={customer.notes} />
            </div>
          )}
        </div>

        {/* ============ TÌNH TRẠNG ============ */}
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Tình trạng:</span>
            <select 
              className="form-input" 
              style={{ flex: 1, maxWidth: '250px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            >
              {Object.entries(CUSTOMER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button 
              className="btn btn-primary" 
              onClick={handleUpdateStatus}
              disabled={status === customer.status}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <Save size={16} /> Cập nhật
            </button>
            {status !== customer.status && (
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>* Chưa lưu</span>
            )}
          </div>
        </div>

        {/* ============ LỊCH SỬ BÁO GIÁ ============ */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} />
              Lịch sử báo giá
            </h4>
            <button 
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              onClick={() => setShowQuotationForm(true)}
            >
              <Plus size={16} /> Tạo báo giá
            </button>
          </div>

          {quotations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Chưa có báo giá nào cho khách hàng này
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface-light)', zIndex: 1 }}>
                  <tr>
                    <th style={thStyle}>Mã BG</th>
                    <th style={thStyle}>Ngày</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Tổng giá trị</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr 
                      key={q.id}
                      onClick={() => setSelectedQuotation(q)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{q.quotation_code}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{fmtDate(q.quotation_date)}</td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatVND(q.total_amount)}</td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <StatusBadge status={q.status} labels={SALE_QUOTATION_STATUS_LABELS} colors={SALE_QUOTATION_STATUS_COLORS} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Quotation Form Modal – opens independently */}
      {showQuotationForm && (
        <QuotationFormModal
          isOpen={showQuotationForm}
          onClose={() => setShowQuotationForm(false)}
          customer={customer}
          onSaved={handleQuotationSaved}
        />
      )}

      {/* Quotation Detail Modal – opens independently */}
      {selectedQuotation && (
        <QuotationDetailModal
          isOpen={!!selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          quotation={selectedQuotation}
          onStatusUpdated={handleQuotationStatusUpdated}
        />
      )}
    </>
  );
}
