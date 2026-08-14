import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SALE_QUOTATION_STATUS_LABELS, SALE_QUOTATION_STATUS_COLORS } from '../../lib/constants';
import type { 
  SaleQuotation, SaleQuotationItem, SaleQuotationStatus, Customer, 
  QuotationDispatchSummary, User 
} from '../../lib/types';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { formatVND, formatDate, formatDateTime, formatNumber } from '../../lib/formatters';
import { db, KEYS } from '../../lib/database';
import { Save, AlertTriangle, PackageCheck, ShoppingBag, Download, RefreshCw, FileText, Printer } from 'lucide-react';
import HoldItemsModal from './HoldItemsModal';
import OrderItemsModal from './OrderItemsModal';
import QuotationPrintPreviewModal from './QuotationPrintPreviewModal';
import { exportHoldItemsExcel, exportOrderItemsExcel } from '../../lib/dispatchExcelExport';
import { exportQuotationExcel, printQuotationPDF } from '../../lib/quotationExport';

interface QuotationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: SaleQuotation;
  onStatusUpdated?: () => void;
}

export default function QuotationDetailModal({ isOpen, onClose, quotation, onStatusUpdated }: QuotationDetailModalProps) {
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>('');
  const [saleName, setSaleName] = useState<string>('');
  const [saleUser, setSaleUser] = useState<User | undefined>(undefined);
  const [status, setStatus] = useState<SaleQuotationStatus>(quotation.status);
  const [items, setItems] = useState<SaleQuotationItem[]>([]);
  const [dispatchSummary, setDispatchSummary] = useState<QuotationDispatchSummary | null>(null);

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);

  const { 
    updateQuotationStatus, 
    getQuotationItems, 
    getQuotationDispatch, 
    refreshQuotationDispatch 
  } = useSaleQuotationStore();

  const loadDispatchData = useCallback((quoteId: string, currentStatus: SaleQuotationStatus) => {
    if (currentStatus === 'WON') {
      let dispatch = getQuotationDispatch(quoteId);
      if (!dispatch) {
        dispatch = db.createOrUpdateQuotationDispatch(quoteId, false);
      }
      setDispatchSummary(dispatch);
    } else {
      setDispatchSummary(null);
    }
  }, [getQuotationDispatch]);

  useEffect(() => {
    if (isOpen && quotation) {
      setStatus(quotation.status);
      // Get customer
      const cust = db.findById<Customer>(KEYS.CUSTOMERS, quotation.customer_id);
      setCustomer(cust);
      setCustomerName(cust?.customer_name || 'Khách hàng không tồn tại');

      // Get sale user
      if (cust?.assigned_sale_id) {
        const users = db.findAll<User>(KEYS.USERS);
        const sUser = users.find((u) => u.id === cust.assigned_sale_id);
        setSaleUser(sUser);
        setSaleName(sUser?.full_name || '');
      } else {
        setSaleUser(undefined);
        setSaleName('');
      }

      // Get snapshot items
      const qItems = getQuotationItems(quotation.id);
      setItems(qItems);

      // Load dispatch data if quotation is WON
      loadDispatchData(quotation.id, quotation.status);
    }
  }, [isOpen, quotation, getQuotationItems, loadDispatchData]);

  const handleUpdateStatus = () => {
    if (status !== quotation.status) {
      updateQuotationStatus(quotation.id, status);
      loadDispatchData(quotation.id, status);
      onStatusUpdated?.();
    }
  };

  const handleRefreshStockSnapshot = () => {
    const confirmed = window.confirm(
      'Cập nhật lại tồn kho sẽ ghi nhận lại số lượng tồn hiện tại của tất cả sản phẩm tại thời điểm này. Bạn có chắc chắn muốn tiếp tục?'
    );
    if (confirmed) {
      const refreshed = refreshQuotationDispatch(quotation.id);
      setDispatchSummary(refreshed);
    }
  };

  const handleExportHold = () => {
    if (dispatchSummary) {
      exportHoldItemsExcel(quotation, customer, dispatchSummary, saleName);
    }
  };

  const handleExportOrder = () => {
    if (dispatchSummary) {
      exportOrderItemsExcel(quotation, customer, dispatchSummary, saleName);
    }
  };

  const handleDirectExportExcel = () => {
    exportQuotationExcel(quotation, customer, items, saleUser || saleName, 'XÁC NHẬN ĐƠN HÀNG', quotation.terms);
  };

  const handleDirectPrintPDF = () => {
    printQuotationPDF(quotation, customer, items, saleUser || saleName, 'XÁC NHẬN ĐƠN HÀNG', quotation.terms);
  };

  const hasBelowDpPrice = items.some((item) => item.sale_price < item.dp_price);

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

  const holdItemsCount = dispatchSummary?.items.filter((i) => i.hold_quantity > 0).length || 0;
  const orderItemsCount = dispatchSummary?.items.filter((i) => i.needed_quantity > 0).length || 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết Báo giá"
        size="xl"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Tổng giá trị:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success)' }}>
                {formatVND(quotation.total_amount)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={handleDirectExportExcel}
                title="Tải ngay file Excel báo giá gửi khách"
              >
                <Download size={15} />
                Xuất Excel
              </button>
              <button
                className="btn btn-outline"
                onClick={handleDirectPrintPDF}
                title="In hoặc Lưu file PDF báo giá"
              >
                <Printer size={15} />
                In / Xuất PDF
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowPrintPreviewModal(true)}
                title="Xem trước bản in báo giá chuẩn A4"
              >
                <FileText size={16} />
                Xem bản in A4
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Info Section */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Mã báo giá
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--primary)' }}>
                  {quotation.quotation_code}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Khách hàng
                </div>
                <div style={{ fontWeight: 500 }}>{customerName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Ngày lập
                </div>
                <div>{formatDate(quotation.quotation_date)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Trạng thái
                </div>
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
                    onChange={(e) => setStatus(e.target.value as SaleQuotationStatus)}
                  >
                    {Object.entries(SALE_QUOTATION_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
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

          {/* ============================================================ */}
          {/* SECTION: ĐIỀU PHỐI HÀNG (Hiển thị khi báo giá ĐÃ CHỐT)         */}
          {/* ============================================================ */}
          {quotation.status === 'WON' && dispatchSummary && (
            <div
              style={{
                padding: '1.25rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: 'var(--success)',
                      fontSize: '1.05rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <PackageCheck size={20} />
                    ĐIỀU PHỐI HÀNG (Báo giá đã chốt)
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Tồn kho ghi nhận lúc chốt đơn: {formatDateTime(dispatchSummary.closed_at)}
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={handleRefreshStockSnapshot}
                  title="Cập nhật lại tồn kho hiện tại"
                >
                  <RefreshCw size={14} />
                  Cập nhật lại tồn kho
                </button>
              </div>

              {/* Statistics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Tổng mặt hàng
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {dispatchSummary.total_products}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', textTransform: 'uppercase' }}>
                    🟢 Đủ hàng
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
                    {dispatchSummary.sufficient_products} mặt hàng
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--warning)', textTransform: 'uppercase' }}>
                    🟠 Cần đặt thêm
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)' }}>
                    {dispatchSummary.insufficient_products} mặt hàng
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', textTransform: 'uppercase' }}>
                    Tổng SL giữ
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
                    {formatNumber(dispatchSummary.total_hold_qty)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--warning)', textTransform: 'uppercase' }}>
                    Tổng SL cần đặt
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)' }}>
                    {formatNumber(dispatchSummary.total_order_qty)}
                  </div>
                </div>
              </div>

              {/* Actions Button Row */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', padding: '0.5rem 0.85rem' }}
                  onClick={() => setShowHoldModal(true)}
                >
                  <PackageCheck size={16} />
                  Xem hàng giữ ({holdItemsCount})
                </button>

                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#f97316', borderColor: '#f97316', padding: '0.5rem 0.85rem' }}
                  onClick={() => setShowOrderModal(true)}
                >
                  <ShoppingBag size={16} />
                  Xem hàng cần đặt ({orderItemsCount})
                </button>

                <button
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 0.85rem' }}
                  onClick={handleExportHold}
                  disabled={holdItemsCount === 0}
                  title="Xuất file Excel danh sách sản phẩm giữ hàng"
                >
                  <Download size={15} />
                  Xuất Excel giữ hàng
                </button>

                <button
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 0.85rem' }}
                  onClick={handleExportOrder}
                  disabled={orderItemsCount === 0}
                  title="Xuất file Excel danh sách sản phẩm cần đặt thêm"
                >
                  <Download size={15} />
                  Xuất Excel đặt hàng
                </button>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {hasBelowDpPrice && (
            <div
              style={{
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
              }}
            >
              <AlertTriangle size={18} />
              ⚠ Có sản phẩm được bán dưới Giá DP
            </div>
          )}

          {/* Product Table (read-only from snapshot) */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'var(--bg-surface-light)',
                borderRadius: 'var(--radius-md)',
                minWidth: '800px',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>STT</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '50px' }}>Ảnh</th>
                  <th style={thStyle}>Mã SP</th>
                  <th style={thStyle}>Tên SP</th>
                  <th style={thStyle}>Hãng</th>
                  <th style={thStyle}>ĐVT</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>SL</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Giá NY</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Giá DP</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Giá bán</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Thành tiền</th>
                  <th style={thStyle}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                          background: isBelowDp ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', padding: '4px' }}>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              style={{ maxWidth: '42px', maxHeight: '42px', objectFit: 'contain', borderRadius: '3px', display: 'inline-block' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary)' }}>{item.product_code}</td>
                        <td style={tdStyle}>{item.product_name}</td>
                        <td style={tdStyle}>{item.brand}</td>
                        <td style={tdStyle}>{item.unit}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(item.listed_price)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(item.dp_price)}</td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'right',
                            color: isBelowDp ? 'var(--warning)' : 'inherit',
                            fontWeight: isBelowDp ? 600 : 'normal',
                          }}
                        >
                          {formatVND(item.sale_price)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatVND(item.amount)}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.note || ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* CÁC ĐIỀU KHOẢN KÈM THEO (BỐ CỤC 2 CỘT COMPACT) */}
          {((quotation.terms && quotation.terms.length > 0) || quotation.note) && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-surface-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                CÁC ĐIỀU KHOẢN KÈM THEO
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  {(quotation.terms || []).filter((t) => t.is_visible).map((term, idx) => (
                    <tr key={term.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 8px', width: '160px', verticalAlign: 'top', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {idx + 1}. {term.term_title}
                      </td>
                      <td style={{ padding: '6px 8px', verticalAlign: 'top', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {term.term_content}
                      </td>
                    </tr>
                  ))}
                  {quotation.note && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 8px', width: '160px', verticalAlign: 'top', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        Ghi chú bổ sung
                      </td>
                      <td style={{ padding: '6px 8px', verticalAlign: 'top', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {quotation.note}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Hold Items Modal */}
      {showHoldModal && dispatchSummary && (
        <HoldItemsModal
          isOpen={showHoldModal}
          onClose={() => setShowHoldModal(false)}
          quotation={quotation}
          customer={customer}
          dispatchSummary={dispatchSummary}
          saleName={saleName}
          onStatusUpdated={() => {
            const refreshed = getQuotationDispatch(quotation.id);
            if (refreshed) setDispatchSummary(refreshed);
          }}
        />
      )}

      {/* Order Items Modal */}
      {showOrderModal && dispatchSummary && (
        <OrderItemsModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          quotation={quotation}
          customer={customer}
          dispatchSummary={dispatchSummary}
          saleName={saleName}
          onStatusUpdated={() => {
            const refreshed = getQuotationDispatch(quotation.id);
            if (refreshed) setDispatchSummary(refreshed);
          }}
        />
      )}

      {/* Quotation Print / PDF Preview Modal */}
      {showPrintPreviewModal && (
        <QuotationPrintPreviewModal
          isOpen={showPrintPreviewModal}
          onClose={() => setShowPrintPreviewModal(false)}
          quotation={quotation}
          customer={customer}
          items={items}
          saleUser={saleUser || saleName}
          customTerms={quotation.terms}
        />
      )}
    </>
  );
}
