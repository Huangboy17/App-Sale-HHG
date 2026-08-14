import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Download, ShoppingCart } from 'lucide-react';
import type { SaleQuotation, QuotationDispatchSummary, Customer } from '../../lib/types';
import { formatNumber, formatDate } from '../../lib/formatters';
import { exportOrderItemsExcel } from '../../lib/dispatchExcelExport';
import { DISPATCH_ORDER_STATUS_LABELS } from '../../lib/constants';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';

interface OrderItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: SaleQuotation;
  customer?: Customer;
  dispatchSummary: QuotationDispatchSummary;
  saleName?: string;
  onStatusUpdated?: () => void;
}

export default function OrderItemsModal({
  isOpen,
  onClose,
  quotation,
  customer,
  dispatchSummary,
  saleName,
  onStatusUpdated,
}: OrderItemsModalProps) {
  const { updateDispatchItemStatus } = useSaleQuotationStore();
  const orderItems = dispatchSummary.items.filter((i) => i.needed_quantity > 0);

  const totalOrderQty = orderItems.reduce((sum, i) => sum + i.needed_quantity, 0);

  const handleExportExcel = () => {
    exportOrderItemsExcel(quotation, customer, dispatchSummary, saleName);
  };

  const handleStatusChange = (
    itemId: string,
    status: 'PENDING' | 'REQUESTED' | 'ORDERED' | 'RECEIVED'
  ) => {
    updateDispatchItemStatus(quotation.id, itemId, { status_order: status });
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
      title="ĐẶT HÀNG (Sản phẩm thiếu tồn kho cần mua thêm)"
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Số mặt hàng cần đặt: <strong style={{ color: 'var(--text-main)' }}>{orderItems.length}</strong> | Tổng SL
            cần mua thêm:{' '}
            <strong style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>{formatNumber(totalOrderQty)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn btn-primary"
              style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
              onClick={handleExportExcel}
              disabled={orderItems.length === 0}
            >
              <Download size={16} />
              Xuất Excel đặt hàng
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>TỔNG SL CẦN ĐẶT</div>
            <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '1.1rem' }}>
              {formatNumber(totalOrderQty)}
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div style={{ overflowX: 'auto', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ ...thStyle, width: '40px' }}>STT</th>
                <th style={thStyle}>Mã SP</th>
                <th style={thStyle}>Tên sản phẩm</th>
                <th style={thStyle}>ĐVT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SL khách đặt</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tồn kho lúc chốt</th>
                <th style={{ ...thStyle, textAlign: 'right', color: 'var(--success)' }}>SL có thể đáp ứng</th>
                <th style={{ ...thStyle, textAlign: 'right', color: 'var(--warning)' }}>SL cần đặt</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShoppingCart size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div>Tất cả sản phẩm trong báo giá này đều đã đủ tồn kho. Không cần đặt thêm.</div>
                  </td>
                </tr>
              ) : (
                orderItems.map((item, index) => {
                  const status = item.status_order || 'PENDING';
                  const availableQty = Math.max(0, item.stock_snapshot);
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
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: 'var(--success)' }}>
                        {formatNumber(availableQty)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: 'var(--warning)' }}>
                        {formatNumber(item.needed_quantity)}
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
                              status === 'RECEIVED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : status === 'ORDERED'
                                ? 'rgba(22, 119, 255, 0.15)'
                                : status === 'REQUESTED'
                                ? 'rgba(8, 145, 178, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            borderColor:
                              status === 'RECEIVED'
                                ? 'var(--success)'
                                : status === 'ORDERED'
                                ? 'var(--primary)'
                                : status === 'REQUESTED'
                                ? 'var(--info)'
                                : 'var(--warning)',
                            color:
                              status === 'RECEIVED'
                                ? 'var(--success)'
                                : status === 'ORDERED'
                                ? 'var(--primary)'
                                : status === 'REQUESTED'
                                ? 'var(--info)'
                                : 'var(--warning)',
                            fontWeight: 600,
                          }}
                          value={status}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as 'PENDING' | 'REQUESTED' | 'ORDERED' | 'RECEIVED'
                            )
                          }
                        >
                          <option value="PENDING">{DISPATCH_ORDER_STATUS_LABELS.PENDING}</option>
                          <option value="REQUESTED">{DISPATCH_ORDER_STATUS_LABELS.REQUESTED}</option>
                          <option value="ORDERED">{DISPATCH_ORDER_STATUS_LABELS.ORDERED}</option>
                          <option value="RECEIVED">{DISPATCH_ORDER_STATUS_LABELS.RECEIVED}</option>
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
