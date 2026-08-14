import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../stores/productStore';
import type { Product } from '../../lib/types';
import { PRODUCT_STATUS_LABELS } from '../../lib/constants';
import { Modal } from '../../components/common/Modal';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const { addProduct, updateProduct, brands, groups } = useProductStore();
  
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    brand: brands[0] || '',
    product_group: groups[0] || '',
    unit: 'Cái',
    base_price: 0,
    dp_price: 0,
    stock_quantity: 0,
    description: '',
    status: 'ACTIVE' as Product['status']
  });

  useEffect(() => {
    if (product) {
      setFormData({
        product_code: product.product_code,
        product_name: product.product_name,
        brand: product.brand,
        product_group: product.product_group,
        unit: product.unit,
        base_price: product.base_price,
        dp_price: product.dp_price ?? product.base_price,
        stock_quantity: product.stock_quantity,
        description: product.description || '',
        status: product.status
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      await updateProduct(product.id, formData);
    } else {
      await addProduct(formData as any);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mã hàng <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.product_code}
              onChange={(e) => setFormData({...formData, product_code: e.target.value})}
              disabled={!!product} // Disable if editing
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tên hàng <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Hãng</label>
            <select 
              className="form-input"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
            >
              {brands.map((brand: string) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nhóm hàng</label>
            <select 
              className="form-input"
              value={formData.product_group}
              onChange={(e) => setFormData({...formData, product_group: e.target.value})}
            >
              {groups.map((group: string) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Đơn vị tính <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select 
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            >
              {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Giá NY sau VAT <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              min="0"
              className="form-input" 
              required
              value={formData.base_price}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  base_price: val,
                  dp_price: (!product && prev.dp_price === 0) ? val : prev.dp_price
                }));
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Giá DP (Giá sàn)</label>
            <input 
              type="number" 
              min="0"
              className="form-input" 
              value={formData.dp_price}
              onChange={(e) => setFormData({...formData, dp_price: Number(e.target.value)})}
            />
          </div>
        </div>

        {formData.dp_price > formData.base_price && formData.base_price > 0 && (
          <div style={{
            padding: '0.5rem 0.75rem', background: 'var(--danger-light)', color: 'var(--danger)',
            borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem'
          }}>
            ⚠ Cảnh báo: Giá DP đang lớn hơn Giá NY sau VAT!
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Tồn kho</label>
          <input 
            type="number" 
            min="0"
            className="form-input" 
            value={formData.stock_quantity}
            onChange={(e) => setFormData({...formData, stock_quantity: Number(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea 
            className="form-input" 
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="modal-footer mt-6">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            Lưu
          </button>
        </div>
      </form>
    </Modal>
  );
}
