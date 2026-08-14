import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../stores/productStore';
import type { Product } from '../../lib/types';
import { formatVND } from '../../lib/formatters';
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
    max_discount_rate: 0,
    vat_rate: 8,
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
        max_discount_rate: product.max_discount_rate,
        vat_rate: product.vat_rate,
        stock_quantity: product.stock_quantity,
        description: product.description || '',
        status: product.status
      });
    }
  }, [product]);

  const dpPrice = formData.base_price * (1 - formData.max_discount_rate / 100);

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
            <label className="form-label">Giá gốc <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              min="0"
              className="form-input" 
              required
              value={formData.base_price}
              onChange={(e) => setFormData({...formData, base_price: Number(e.target.value)})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Hệ số CK tối đa (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              className="form-input" 
              value={formData.max_discount_rate}
              onChange={(e) => setFormData({...formData, max_discount_rate: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 flex justify-between items-center">
          <span className="font-semibold text-blue-800">Giá DP (Đại lý phân phối)</span>
          <span className="text-xl font-bold text-blue-900">{formatVND(dpPrice)}</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">VAT (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              className="form-input" 
              value={formData.vat_rate}
              onChange={(e) => setFormData({...formData, vat_rate: Number(e.target.value)})}
            />
          </div>
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
