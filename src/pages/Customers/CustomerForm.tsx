import React, { useState, useEffect } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import type { Customer, User } from '../../lib/types';
import { CUSTOMER_SOURCES } from '../../lib/constants';
import { db } from '../../lib/database';
import { Modal } from '../../components/common/Modal';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

export default function CustomerForm({ isOpen, onClose, customer }: CustomerFormProps) {
  const { addCustomer, updateCustomer, customers } = useCustomerStore();
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_code: '',
    source: 'DIRECT' as Customer['source'],
    assigned_sale_id: '',
    notes: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await db.getUsers();
      setSalesUsers(allUsers.filter(u => u.role === 'SALE' || u.role === 'MANAGER'));
    };
    fetchUsers();

    if (customer) {
      setFormData({
        customer_name: customer.customer_name,
        company_name: customer.company_name || '',
        contact_person: customer.contact_person || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        tax_code: customer.tax_code || '',
        source: customer.source,
        assigned_sale_id: customer.assigned_sale_id || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  useEffect(() => {
    // Check duplicates
    if (formData.customer_name.length > 2 && (formData.phone || formData.email)) {
      const isDuplicate = customers.some(c => 
        c.id !== customer?.id && 
        c.customer_name.toLowerCase() === formData.customer_name.toLowerCase() &&
        (
          (formData.phone && c.phone === formData.phone) || 
          (formData.email && c.email === formData.email)
        )
      );
      if (isDuplicate) {
        setDuplicateWarning('Cảnh báo: Khách hàng này có thể đã tồn tại trong hệ thống!');
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.customer_name, formData.phone, formData.email, customers, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customer) {
      await updateCustomer(customer.id, formData);
    } else {
      await addCustomer(formData as any);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Sửa Khách hàng' : 'Thêm Khách hàng'}>
      <form onSubmit={handleSubmit}>
        {duplicateWarning && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg mb-4 text-sm font-medium border border-yellow-200">
            {duplicateWarning}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tên KH <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Công ty</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Người liên hệ</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.contact_person}
              onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">SĐT</label>
            <input 
              type="tel" 
              className="form-input" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mã số thuế</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.tax_code}
              onChange={(e) => setFormData({...formData, tax_code: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Địa chỉ</label>
          <input 
            type="text" 
            className="form-input" 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nguồn khách</label>
            <select 
              className="form-input"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value as any})}
            >
              {CUSTOMER_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sale phụ trách</label>
            <select 
              className="form-input"
              value={formData.assigned_sale_id}
              onChange={(e) => setFormData({...formData, assigned_sale_id: e.target.value})}
            >
              <option value="">-- Chọn Sale --</option>
              {salesUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ghi chú</label>
          <textarea 
            className="form-input" 
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
