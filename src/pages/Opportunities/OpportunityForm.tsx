import React, { useState, useEffect } from 'react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import type { Opportunity, User } from '../../lib/types';
import { PRIORITY_LABELS } from '../../lib/constants';
import { db } from '../../lib/database';
import { Modal } from '../../components/common/Modal';

interface OpportunityFormProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity;
}

export default function OpportunityForm({ isOpen, onClose, opportunity }: OpportunityFormProps) {
  const { addOpportunity, updateOpportunity } = useOpportunityStore();
  const { customers } = useCustomerStore();
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  
  const [salesUsers, setSalesUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    project_id: '',
    assigned_sale_id: user?.id || '',
    received_date: new Date().toISOString().split('T')[0],
    expected_close_date: '',
    requirements: '',
    estimated_value: 0,
    priority: 'MEDIUM' as Opportunity['priority'],
    notes: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await db.getUsers();
      setSalesUsers(allUsers.filter(u => u.role === 'SALE' || u.role === 'MANAGER'));
    };
    fetchUsers();

    if (opportunity) {
      setFormData({
        customer_id: opportunity.customer_id,
        project_id: opportunity.project_id || '',
        assigned_sale_id: opportunity.assigned_sale_id,
        received_date: opportunity.received_date.split('T')[0],
        expected_close_date: opportunity.expected_close_date ? opportunity.expected_close_date.split('T')[0] : '',
        requirements: opportunity.requirements || '',
        estimated_value: opportunity.estimated_value || 0,
        priority: opportunity.priority,
        notes: opportunity.notes || ''
      });
    }
  }, [opportunity, user]);

  const filteredProjects = formData.customer_id 
    ? projects.filter(p => p.customer_id === formData.customer_id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      received_date: new Date(formData.received_date).toISOString(),
      expected_close_date: formData.expected_close_date ? new Date(formData.expected_close_date).toISOString() : undefined,
      project_id: formData.project_id || undefined
    };

    if (opportunity) {
      await updateOpportunity(opportunity.id, payload);
    } else {
      await addOpportunity(payload as any);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={opportunity ? 'Sửa Cơ hội' : 'Thêm Cơ hội mới'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Khách hàng <span className="text-red-500">*</span></label>
            <select 
              className="form-input"
              required
              value={formData.customer_id}
              onChange={(e) => {
                setFormData({...formData, customer_id: e.target.value, project_id: ''});
              }}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dự án</label>
            <select 
              className="form-input"
              value={formData.project_id}
              onChange={(e) => setFormData({...formData, project_id: e.target.value})}
              disabled={!formData.customer_id || filteredProjects.length === 0}
            >
              <option value="">-- Chọn dự án --</option>
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Sale phụ trách</label>
            <select 
              className="form-input"
              value={formData.assigned_sale_id}
              onChange={(e) => setFormData({...formData, assigned_sale_id: e.target.value})}
              disabled={user?.role !== 'MANAGER'}
            >
              {salesUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mức độ ưu tiên</label>
            <select 
              className="form-input"
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
            >
              {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ngày tiếp nhận <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              className="form-input" 
              required
              value={formData.received_date}
              onChange={(e) => setFormData({...formData, received_date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ngày dự kiến chốt</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.expected_close_date}
              onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Giá trị dự kiến (VNĐ)</label>
          <input 
            type="number" 
            min="0"
            className="form-input" 
            value={formData.estimated_value}
            onChange={(e) => setFormData({...formData, estimated_value: Number(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nhu cầu</label>
          <textarea 
            className="form-input" 
            rows={3}
            value={formData.requirements}
            onChange={(e) => setFormData({...formData, requirements: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ghi chú</label>
          <textarea 
            className="form-input" 
            rows={2}
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
