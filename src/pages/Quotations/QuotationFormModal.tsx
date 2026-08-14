import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Plus, Trash2, AlertTriangle, FileCheck, RotateCcw } from 'lucide-react';
import type { Customer, Product, QuotationTerm } from '../../lib/types';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { formatVND } from '../../lib/formatters';
import { DEFAULT_QUOTATION_TERMS } from '../../lib/quotationExport';
import ProductPickerModal from './ProductPickerModal';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSaved: () => void;
}

type PriceMode = 'price' | 'discount';

interface QuotationLineItem {
  product: Product;
  quantity: number;
  sale_price: number;
  note?: string;
  // UI-only state (not saved to DB)
  priceMode: PriceMode;
  discountPercent: number;
}

/* ─── Style constants ─── */

const thBase: React.CSSProperties = {
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  borderBottom: '2px solid var(--border-color)',
  color: 'var(--text-muted)',
};

const thRef: React.CSSProperties = { ...thBase, textAlign: 'right' };

const thInput: React.CSSProperties = {
  ...thBase,
  color: '#60a5fa',
  textAlign: 'center',
};

const tdBase: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '0.875rem',
  verticalAlign: 'top',
};

const qtyInputStyle: React.CSSProperties = {
  width: '72px',
  padding: '8px 6px',
  textAlign: 'center',
  fontSize: '0.95rem',
  fontWeight: 600,
  backgroundColor: 'rgba(96, 165, 250, 0.08)',
  border: '2px solid rgba(96, 165, 250, 0.35)',
  borderRadius: '6px',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const priceInputBase: React.CSSProperties = {
  width: '120px',
  padding: '8px 10px',
  textAlign: 'right',
  fontSize: '1rem',
  fontWeight: 700,
  backgroundColor: 'rgba(96, 165, 250, 0.08)',
  border: '2px solid rgba(96, 165, 250, 0.45)',
  borderRadius: '6px',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const priceInputWarning: React.CSSProperties = {
  ...priceInputBase,
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: '2px solid var(--warning)',
  color: 'var(--warning)',
};

const discountInputStyle: React.CSSProperties = {
  width: '72px',
  padding: '8px 6px',
  textAlign: 'center',
  fontSize: '1rem',
  fontWeight: 700,
  backgroundColor: 'rgba(96, 165, 250, 0.08)',
  border: '2px solid rgba(96, 165, 250, 0.45)',
  borderRadius: '6px',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  cursor: 'pointer',
  fontSize: '0.72rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
};

const radioLabelActiveStyle: React.CSSProperties = {
  ...radioLabelStyle,
  color: '#60a5fa',
  fontWeight: 600,
};

/* ─── Helpers ─── */

function calcPriceFromDiscount(listedPrice: number, discountPercent: number): number {
  return Math.round(listedPrice * (1 - discountPercent / 100));
}

function calcDiscountFromPrice(listedPrice: number, salePrice: number): number {
  if (listedPrice <= 0) return 0;
  const pct = ((listedPrice - salePrice) / listedPrice) * 100;
  return Math.round(pct * 100) / 100; // 2 decimal places
}

/* ─── Focus handlers ─── */

function onInputFocus(e: React.FocusEvent<HTMLInputElement>, isWarning: boolean) {
  if (!isWarning) e.currentTarget.style.borderColor = '#60a5fa';
  e.currentTarget.style.boxShadow = isWarning
    ? '0 0 0 3px rgba(245,158,11,0.25)'
    : '0 0 0 3px rgba(96,165,250,0.25)';
}

function onInputBlur(e: React.FocusEvent<HTMLInputElement>, isWarning: boolean) {
  e.currentTarget.style.borderColor = isWarning
    ? 'var(--warning)'
    : 'rgba(96,165,250,0.45)';
  e.currentTarget.style.boxShadow = 'none';
}

/* ═══════════════════════════════════════════════ */

export default function QuotationFormModal({
  isOpen,
  onClose,
  customer,
  onSaved,
}: QuotationFormModalProps) {
  const [items, setItems] = useState<QuotationLineItem[]>([]);
  const [note, setNote] = useState('');
  const [terms, setTerms] = useState<QuotationTerm[]>(
    DEFAULT_QUOTATION_TERMS.map((t) => ({ ...t }))
  );
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  const createQuotation = useSaleQuotationStore((state) => state.createQuotation);

  const handleAddProduct = (product: Product) => {
    const existingIdx = items.findIndex((item) => item.product.id === product.id);
    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].quantity += 1;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product,
          quantity: 1,
          sale_price: product.base_price,
          note: '',
          priceMode: 'price',
          discountPercent: 0,
        },
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  /* ── Update quantity ── */
  const handleUpdateQty = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity: value };
    setItems(newItems);
  };

  /* ── Update sale_price directly ── */
  const handleUpdatePrice = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], sale_price: value };
    setItems(newItems);
  };

  /* ── Update item note ── */
  const handleUpdateItemNote = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], note: val };
    setItems(newItems);
  };

  /* ── Update discount % → recalculate sale_price ── */
  const handleUpdateDiscount = (index: number, pct: number) => {
    const newItems = [...items];
    const listedPrice = newItems[index].product.base_price;
    const newPrice = calcPriceFromDiscount(listedPrice, pct);
    newItems[index] = {
      ...newItems[index],
      discountPercent: pct,
      sale_price: newPrice,
    };
    setItems(newItems);
  };

  /* ── Toggle price mode ── */
  const handleToggleMode = (index: number, mode: PriceMode) => {
    const newItems = [...items];
    const item = newItems[index];

    if (mode === item.priceMode) return;

    if (mode === 'discount') {
      // Switching TO discount mode: reverse-calculate % from current price
      const pct = calcDiscountFromPrice(item.product.base_price, item.sale_price);
      newItems[index] = { ...item, priceMode: 'discount', discountPercent: pct };
    } else {
      // Switching TO price mode: keep current sale_price as-is
      newItems[index] = { ...item, priceMode: 'price' };
    }
    setItems(newItems);
  };

  /* ── Term handlers ── */
  const handleToggleTerm = (index: number) => {
    const newTerms = [...terms];
    newTerms[index].is_visible = !newTerms[index].is_visible;
    setTerms(newTerms);
  };

  const handleUpdateTermTitle = (index: number, title: string) => {
    const newTerms = [...terms];
    newTerms[index].term_title = title;
    setTerms(newTerms);
  };

  const handleUpdateTermContent = (index: number, content: string) => {
    const newTerms = [...terms];
    newTerms[index].term_content = content;
    setTerms(newTerms);
  };

  const handleAddTerm = () => {
    const newTerm: QuotationTerm = {
      id: `term-${Date.now()}`,
      term_title: `Điều khoản ${terms.length + 1}`,
      term_content: '',
      display_order: terms.length + 1,
      is_visible: true,
    };
    setTerms([...terms, newTerm]);
  };

  const handleRemoveTerm = (index: number) => {
    const newTerms = [...terms];
    newTerms.splice(index, 1);
    setTerms(newTerms);
  };

  const handleResetTerms = () => {
    setTerms(DEFAULT_QUOTATION_TERMS.map((t) => ({ ...t })));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.sale_price, 0);
  }, [items]);

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm');
      return;
    }

    const invalidItem = items.find(
      (item) => item.quantity <= 0 || item.sale_price <= 0
    );
    if (invalidItem) {
      alert('Số lượng và Giá bán phải lớn hơn 0');
      return;
    }

    try {
      // Pass items and terms to store
      await createQuotation(customer.id, items, note, terms);
      onSaved();
      onClose();
      setItems([]);
      setNote('');
      setTerms(DEFAULT_QUOTATION_TERMS.map((t) => ({ ...t })));
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Có lỗi xảy ra khi lưu báo giá');
    }
  };

  const todayStr = new Date().toLocaleDateString('vi-VN');

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Tạo báo giá / Xác nhận đơn hàng mới"
        size="xl"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Tổng giá trị: <span className="text-success">{formatVND(totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={onClose}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>Lưu báo giá</button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Mã BG / ĐH</div>
              <div style={{ fontWeight: 500 }}>Tự động</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Khách hàng</div>
              <div style={{ fontWeight: 500 }}>{customer.customer_name}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Ngày lập</div>
              <div style={{ fontWeight: 500 }}>{todayStr}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Trạng thái</div>
              <div><span className="badge badge-default">Nháp</span></div>
            </div>
          </div>

          {/* Product table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Sản phẩm</h3>
              <button
                className="btn btn-outline"
                onClick={() => setIsProductPickerOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, width: '36px' }}>STT</th>
                    <th style={thBase}>Mã SP</th>
                    <th style={thBase}>Tên sản phẩm</th>
                    <th style={thBase}>Hãng</th>
                    <th style={thBase}>ĐVT</th>
                    <th style={{ ...thInput, width: '88px' }}>✏️ SL</th>
                    <th style={thRef}>Giá NY sau VAT</th>
                    <th style={thRef}>Giá DP</th>
                    <th style={{ ...thInput, width: '190px' }}>✏️ Giá bán</th>
                    <th style={{ ...thBase, textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ ...thBase, width: '160px' }}>Ghi chú</th>
                    <th style={{ ...thBase, width: '36px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Chưa có sản phẩm nào. Bấm [+ Thêm sản phẩm] để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const { product, quantity, sale_price, priceMode, discountPercent, note: itemNote } = item;
                      const isWarning = sale_price < product.dp_price && sale_price > 0;

                      return (
                        <tr
                          key={`${product.id}-${index}`}
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                          {/* STT */}
                          <td style={tdBase}>{index + 1}</td>

                          {/* Mã SP */}
                          <td style={{ ...tdBase, fontWeight: 500, color: 'var(--primary)' }}>{product.product_code}</td>

                          {/* Tên SP */}
                          <td style={tdBase}>
                            <div style={{ fontWeight: 500 }}>{product.product_name}</div>
                          </td>

                          {/* Hãng */}
                          <td style={{ ...tdBase, color: 'var(--text-muted)', fontWeight: 500 }}>
                            {product.brand || ''}
                          </td>

                          {/* ĐVT */}
                          <td style={{ ...tdBase, color: 'var(--text-muted)' }}>{product.unit}</td>

                          {/* ═══ SỐ LƯỢNG ═══ */}
                          <td style={{ ...tdBase, textAlign: 'center' }}>
                            <input
                              type="number"
                              style={qtyInputStyle}
                              value={quantity || ''}
                              min={1}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#60a5fa';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.2)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 0)}
                            />
                          </td>

                          {/* Giá NY sau VAT (tham khảo) */}
                          <td style={{ ...tdBase, textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatVND(product.base_price)}
                          </td>

                          {/* Giá DP (tham khảo) */}
                          <td style={{ ...tdBase, textAlign: 'right', fontWeight: 500 }}>
                            {formatVND(product.dp_price)}
                          </td>

                          {/* ═══ GIÁ BÁN (2 chế độ) ═══ */}
                          <td style={{ ...tdBase, textAlign: 'center' }}>
                            {/* Mode selector */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '6px' }}>
                              <label style={priceMode === 'price' ? radioLabelActiveStyle : radioLabelStyle}>
                                <input
                                  type="radio"
                                  name={`mode-${index}`}
                                  checked={priceMode === 'price'}
                                  onChange={() => handleToggleMode(index, 'price')}
                                  style={{ accentColor: '#60a5fa', width: '12px', height: '12px', margin: 0 }}
                                />
                                Nhập giá
                              </label>
                              <label style={priceMode === 'discount' ? radioLabelActiveStyle : radioLabelStyle}>
                                <input
                                  type="radio"
                                  name={`mode-${index}`}
                                  checked={priceMode === 'discount'}
                                  onChange={() => handleToggleMode(index, 'discount')}
                                  style={{ accentColor: '#60a5fa', width: '12px', height: '12px', margin: 0 }}
                                />
                                % CK
                              </label>
                            </div>

                            {priceMode === 'price' ? (
                              /* ── Direct price input ── */
                              <div>
                                <input
                                  type="number"
                                  style={isWarning ? priceInputWarning : priceInputBase}
                                  value={sale_price || ''}
                                  min={0}
                                  onFocus={(e) => onInputFocus(e, isWarning)}
                                  onBlur={(e) => onInputBlur(e, isWarning)}
                                  onChange={(e) => handleUpdatePrice(index, parseInt(e.target.value) || 0)}
                                />
                              </div>
                            ) : (
                              /* ── Discount % input ── */
                              <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    style={isWarning ? { ...discountInputStyle, border: '2px solid var(--warning)', backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' } : discountInputStyle}
                                    value={discountPercent || ''}
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    onFocus={(e) => onInputFocus(e, isWarning)}
                                    onBlur={(e) => onInputBlur(e, isWarning)}
                                    onChange={(e) => handleUpdateDiscount(index, parseFloat(e.target.value) || 0)}
                                  />
                                  <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.9rem' }}>%</span>
                                </div>
                                <div style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  = <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatVND(sale_price)}</span>
                                </div>
                              </div>
                            )}

                            {/* Warning */}
                            {isWarning && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                color: 'var(--warning)',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                marginTop: '4px',
                              }}>
                                <AlertTriangle size={10} />
                                Thấp hơn Giá DP
                              </div>
                            )}
                          </td>

                          {/* Thành tiền */}
                          <td style={{ ...tdBase, textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                            {formatVND(quantity * sale_price)}
                          </td>

                          {/* Ghi chú */}
                          <td style={tdBase}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '100%', minWidth: '130px', padding: '6px 8px', fontSize: '0.85rem' }}
                              placeholder="Quy cách, màu..."
                              value={itemNote || ''}
                              onChange={(e) => handleUpdateItemNote(index, e.target.value)}
                            />
                          </td>

                          {/* Xóa */}
                          <td style={{ ...tdBase, textAlign: 'center' }}>
                            <button
                              className="btn-icon text-danger"
                              onClick={() => handleRemoveProduct(index)}
                              title="Xóa"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CÁC ĐIỀU KHOẢN KÈM THEO                                       */}
          {/* ============================================================ */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--bg-surface-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={18} />
                CÁC ĐIỀU KHOẢN KÈM THEO
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline text-sm"
                  onClick={handleResetTerms}
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                  title="Khôi phục các điều khoản mẫu ban đầu"
                >
                  <RotateCcw size={13} />
                  Mặc định
                </button>
                <button
                  type="button"
                  className="btn btn-outline text-sm"
                  onClick={handleAddTerm}
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <Plus size={13} />
                  Thêm điều khoản
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {terms.map((term, index) => (
                <div
                  key={term.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px 12px',
                    background: term.is_visible ? 'var(--bg-surface)' : 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    opacity: term.is_visible ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={term.is_visible}
                        onChange={() => handleToggleTerm(index)}
                        title="Bật/tắt hiển thị điều khoản này"
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{index + 1}.</span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontWeight: 600, flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                        value={term.term_title}
                        onChange={(e) => handleUpdateTermTitle(index, e.target.value)}
                        placeholder="Tiêu đề điều khoản (VD: Đơn giá, Thanh toán...)"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-icon text-danger"
                      onClick={() => handleRemoveTerm(index)}
                      title="Xóa điều khoản này"
                      style={{ padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {term.is_visible && (
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
                      value={term.term_content}
                      onChange={(e) => handleUpdateTermContent(index, e.target.value)}
                      placeholder="Nội dung chi tiết của điều khoản (hỗ trợ xuống dòng)..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú chung */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.875rem' }}>Ghi chú chung bổ sung (nếu có)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Nhập ghi chú chung khác cho báo giá..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Product Picker Modal */}
      {isProductPickerOpen && (
        <ProductPickerModal
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          onSelect={(product) => {
            handleAddProduct(product);
            setIsProductPickerOpen(false);
          }}
          excludeProductIds={items.map((i) => i.product.id)}
        />
      )}
    </>
  );
}
