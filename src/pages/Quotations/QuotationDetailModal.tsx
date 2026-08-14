import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SALE_QUOTATION_STATUS_LABELS, SALE_QUOTATION_STATUS_COLORS } from '../../lib/constants';
import type { SaleQuotation, SaleQuotationItem, SaleQuotationStatus, Customer } from '../../lib/types';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { formatVND, formatDate } from '../../lib/formatters';
import { db, KEYS } from '../../lib/database';
import { Save, AlertTriangle } from 'lucide-react';

interface QuotationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: SaleQuotation;
  onStatusUpdated?: () => void;
}

export default function QuotationDetailModal({ isOpen, onClose, quotation, onStatusUpdated }: QuotationDetailModalProps) {
  const [customerName, setCustomerName] = useState<string>('');
  const [status, setStatus] = useState<SaleQuotationStatus>(quotation.status);
  const [items, setItems] = useState<SaleQuotationItem[]>([]);

  const { updateQuotationStatus, getQuotationItems } = useSaleQuotationStore();

  useEffect(() => {
    if (isOpen && quotation) {
      setStatus(quotation.status);
      // Get customer name
      const customer = db.findById<Customer>(KEYS.CUSTOMERS, quotation.customer_id);
      setCustomerName(customer?.customer_name || 'Khách hàng không tồn tại');
      // Get snapshot items
      const qItems = getQuotationItems(quotation.id);
      setItems(qItems);
    }
  }, [isOpen, quotation, getQuotationItems]);

  const handleUpdateStatus = () => {
    if (status !== quotation.status) {
      updateQuotationStatus(quotation.id, status);
      onStatusUpdated?.();
    }
  };

  const hasBelowDpPrice = items.some(item => item.sale_price < item.dp_price);

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '2px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết Báo giá"
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Tổng giá trị:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
              {formatVND(quotation.total_amount)}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Info Section */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mã báo giá</div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--primary)' }}>{quotation.quotation_code}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Khách hàng</div>
              <div style={{ fontWeight: 500 }}>{customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ngày lập</div>
              <div>{formatDate(quotation.quotation_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trạng thái</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <StatusBadge 
                  status={quotation.status} 
                  labels={SALE_QUOTATION_STATUS_LABELS} 
                  colors={SALE_QUOTATION_STATUS_COLORS} 
                />
                <select 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.375rem 2rem 0.375rem 0.75rem' }}
                  value={status} 
                  onChange={e => setStatus(e.target.value as SaleQuotationStatus)}
                >
                  {Object.entries(SALE_QUOTATION_STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={handleUpdateStatus}
                  disabled={status === quotation.status}
                  style={{ padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} />
                  Cập nhật
                </button>
              </div>
              {status !== quotation.status && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--warning)' }}>
                  * Chưa lưu thay đổi
                </div>
              )}
            </div>
            {quotation.note && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ghi chú</div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  {quotation.note}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        {hasBelowDpPrice && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.75rem 1rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid var(--warning)',
            color: 'var(--warning)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            <AlertTriangle size={18} />
            ⚠ Có sản phẩm được bán dưới Giá DP
          </div>
        )}

        {/* Product Table (read-only from snapshot) */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Mã SP</th>
                <th style={thStyle}>Tên SP</th>
                <th style={thStyle}>Hãng</th>
                <th style={thStyle}>ĐVT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SL</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Giá NY</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Giá DP</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Giá bán</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không có sản phẩm nào trong báo giá này
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const isBelowDp = item.sale_price < item.dp_price;
                  return (
                    <tr 
                      key={item.id || index} 
                      style={{ 
                        background: isBelowDp ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
                      }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary)' }}>{item.product_code}</td>
                      <td style={tdStyle}>{item.product_name}</td>
                      <td style={tdStyle}>{item.brand}</td>
                      <td style={tdStyle}>{item.unit}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(item.listed_price)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(item.dp_price)}</td>
                      <td style={{ 
                        ...tdStyle, 
                        textAlign: 'right',
                        color: isBelowDp ? 'var(--warning)' : 'inherit',
                        fontWeight: isBelowDp ? 600 : 'normal',
                      }}>
                        {formatVND(item.sale_price)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                        {formatVND(item.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
