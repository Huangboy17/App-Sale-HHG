import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Download, Package } from 'lucide-react';
import type { SaleQuotation, QuotationDispatchSummary, Customer } from '../../lib/types';
import { formatNumber, formatDate } from '../../lib/formatters';
import { exportHoldItemsExcel } from '../../lib/dispatchExcelExport';
import { HOLD_STATUS_LABELS } from '../../lib/constants';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';

interface HoldItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: SaleQuotation;
  customer?: Customer;
  dispatchSummary: QuotationDispatchSummary;
  saleName?: string;
  onStatusUpdated?: () => void;
}

export default function HoldItemsModal({
  isOpen,
  onClose,
  quotation,
  customer,
  dispatchSummary,
  saleName,
  onStatusUpdated,
}: HoldItemsModalProps) {
  const { updateDispatchItemStatus } = useSaleQuotationStore();
  const holdItems = dispatchSummary.items.filter((i) => i.hold_quantity > 0);

  const totalHoldQty = holdItems.reduce((sum, i) => sum + i.hold_quantity, 0);

  const handleExportExcel = () => {
    exportHoldItemsExcel(quotation, customer, dispatchSummary, saleName);
  };

  const handleStatusChange = (itemId: string, status: 'PENDING' | 'HELD') => {
    updateDispatchItemStatus(quotation.id, itemId, { status_hold: status });
    onStatusUpdated?.();
  };

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '2px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    background: 'var(--bg-surface-light)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.875rem',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GIỮ HÀNG (Sản phẩm có sẵn tồn kho)"
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Tổng số mặt hàng: <strong style={{ color: 'var(--text-main)' }}>{holdItems.length}</strong> | Tổng SL giữ:{' '}
            <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{formatNumber(totalHoldQty)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
              onClick={handleExportExcel}
              disabled={holdItems.length === 0}
            >
              <Download size={16} />
              Xuất Excel giữ hàng
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Info summary banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-surface-light)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>MÃ BÁO GIÁ</div>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{quotation.quotation_code}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>KHÁCH HÀNG</div>
            <div style={{ fontWeight: 500 }}>{customer?.customer_name || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>NGÀY CHỐT ĐƠN</div>
            <div>{formatDate(dispatchSummary.closed_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>TỔNG SL GIỮ</div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
              {formatNumber(totalHoldQty)}
            </div>
          </div>
        </div>

        {/* Hold Items Table */}
        <div style={{ overflowX: 'auto', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ ...thStyle, width: '40px' }}>STT</th>
                <th style={thStyle}>Mã SP</th>
                <th style={thStyle}>Tên sản phẩm</th>
                <th style={thStyle}>ĐVT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SL khách đặt</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tồn kho lúc chốt</th>
                <th style={{ ...thStyle, textAlign: 'right', color: 'var(--success)' }}>SL giữ hàng</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {holdItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div>Không có sản phẩm nào đủ tồn kho để giữ</div>
                  </td>
                </tr>
              ) : (
                holdItems.map((item, index) => {
                  const status = item.status_hold || 'PENDING';
                  return (
                    <tr key={item.id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary)' }}>{item.product_code}</td>
                      <td style={tdStyle}>
                        <div>{item.product_name}</div>
                        {item.brand && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.brand}</div>
                        )}
                      </td>
                      <td style={tdStyle}>{item.unit}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>
                        {formatNumber(item.ordered_quantity)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatNumber(item.stock_snapshot)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        {formatNumber(item.hold_quantity)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <select
                          className="form-input"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.8rem',
                            width: 'auto',
                            display: 'inline-block',
                            backgroundColor:
                              status === 'HELD' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            borderColor: status === 'HELD' ? 'var(--success)' : 'var(--warning)',
                            color: status === 'HELD' ? 'var(--success)' : 'var(--warning)',
                            fontWeight: 600,
                          }}
                          value={status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as 'PENDING' | 'HELD')}
                        >
                          <option value="PENDING">{HOLD_STATUS_LABELS.PENDING}</option>
                          <option value="HELD">{HOLD_STATUS_LABELS.HELD}</option>
                        </select>
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
