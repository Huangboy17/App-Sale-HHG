import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { Customer, Product } from '../../lib/types';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { formatVND } from '../../lib/formatters';
import ProductPickerModal from './ProductPickerModal';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSaved: () => void;
}

interface QuotationLineItem {
  product: Product;
  quantity: number;
  sale_price: number;
}

export default function QuotationFormModal({
  isOpen,
  onClose,
  customer,
  onSaved,
}: QuotationFormModalProps) {
  const [items, setItems] = useState<QuotationLineItem[]>([]);
  const [note, setNote] = useState('');
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  
  const createQuotation = useSaleQuotationStore((state) => state.createQuotation);

  const handleAddProduct = (product: Product) => {
    // Check if product already exists, if so increment qty
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
        },
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof QuotationLineItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
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
      await createQuotation(customer.id, items, note);
      
      onSaved();
      onClose();
      // Reset form state for next open
      setItems([]);
      setNote('');
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
        title="Tạo báo giá mới"
        size="xl"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Tổng giá trị: <span className="text-success">{formatVND(totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={onClose}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Lưu báo giá
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Mã BG</div>
              <div style={{ fontWeight: '500' }}>Tự động</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Khách hàng</div>
              <div style={{ fontWeight: '500' }}>{customer.customer_name}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Ngày</div>
              <div style={{ fontWeight: '500' }}>{todayStr}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Trạng thái</div>
              <div>
                <span className="badge badge-default">Nháp</span>
              </div>
            </div>
          </div>

          {/* Product table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Sản phẩm</h3>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px', width: '40px' }}>STT</th>
                    <th style={{ padding: '12px' }}>Mã SP</th>
                    <th style={{ padding: '12px' }}>Tên SP</th>
                    <th style={{ padding: '12px' }}>Hãng</th>
                    <th style={{ padding: '12px' }}>ĐVT</th>
                    <th style={{ padding: '12px', width: '100px' }}>SL</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Giá NY sau VAT</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Giá DP</th>
                    <th style={{ padding: '12px', width: '120px', textAlign: 'right' }}>Giá bán</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Chưa có sản phẩm nào. Bấm [+ Thêm sản phẩm] để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const { product, quantity, sale_price } = item;
                      const isWarning = sale_price < product.dp_price;
                      
                      return (
                        <tr 
                          key={`${product.id}-${index}`} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: isWarning ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px' }}>{index + 1}</td>
                          <td style={{ padding: '12px' }}>{product.product_code}</td>
                          <td style={{ padding: '12px' }}>
                            <div>{product.product_name}</div>
                            {isWarning && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '0.75rem', marginTop: '4px' }}>
                                <AlertTriangle size={12} />
                                Giá bán thấp hơn Giá DP
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>{product.brand}</td>
                          <td style={{ padding: '12px' }}>{product.unit}</td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              className="form-input"
                              style={{ width: '80px', padding: '4px 8px', height: 'auto' }}
                              value={quantity || ''}
                              min={1}
                              onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{formatVND(product.base_price)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{formatVND(product.dp_price)}</td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              className="form-input"
                              style={{ width: '100px', padding: '4px 8px', height: 'auto', textAlign: 'right' }}
                              value={sale_price || ''}
                              min={0}
                              onChange={(e) => handleUpdateItem(index, 'sale_price', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                            {formatVND(quantity * sale_price)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
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

          {/* Ghi chú */}
          <div className="form-group">
            <label className="form-label">Ghi chú báo giá</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Nhập ghi chú cho báo giá..."
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
          excludeProductIds={items.map(i => i.product.id)}
        />
      )}
    </>
  );
}
