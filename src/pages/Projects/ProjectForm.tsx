import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useCustomerStore } from '../../stores/customerStore';
import type { Project } from '../../lib/types';
import { PROJECT_STATUS_LABELS } from '../../lib/constants';
import { Modal } from '../../components/common/Modal';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export default function ProjectForm({ isOpen, onClose, project }: ProjectFormProps) {
  const { addProject, updateProject } = useProjectStore();
  const { customers } = useCustomerStore();

  const [formData, setFormData] = useState({
    project_name: '',
    customer_id: '',
    location: '',
    investor: '',
    contact_person: '',
    project_progress: '',
    expected_delivery_date: '',
    notes: '',
    status: 'ACTIVE' as Project['status']
  });

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name,
        customer_id: project.customer_id,
        location: project.location || '',
        investor: project.investor || '',
        contact_person: project.contact_person || '',
        project_progress: project.project_progress || '',
        expected_delivery_date: project.expected_delivery_date ? project.expected_delivery_date.split('T')[0] : '',
        notes: project.notes || '',
        status: project.status
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      expected_delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : undefined
    };

    if (project) {
      await updateProject(project.id, payload as any);
    } else {
      await addProject(payload as any);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Sửa Dự án' : 'Thêm Dự án'}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tên dự án <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.project_name}
              onChange={(e) => setFormData({...formData, project_name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Khách hàng <span className="text-red-500">*</span></label>
            <select 
              className="form-input"
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Địa điểm</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Chủ đầu tư</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.investor}
              onChange={(e) => setFormData({...formData, investor: e.target.value})}
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
            <label className="form-label">Trạng thái</label>
            <select 
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tiến độ</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.project_progress}
              onChange={(e) => setFormData({...formData, project_progress: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ngày dự kiến cần hàng</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
            />
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
