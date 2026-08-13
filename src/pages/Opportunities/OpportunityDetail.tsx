import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { formatVND, formatDate } from '../../lib/formatters';
import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, DEFAULT_REJECTION_REASONS } from '../../lib/constants';
import { db } from '../../lib/database';
import type { User, Opportunity } from '../../lib/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import OpportunityForm from './OpportunityForm';
import { Modal } from '../../components/common/Modal';

const STATUS_ORDER = ['LEAD', 'CONSULTING', 'QUOTING', 'NEGOTIATING', 'WON', 'LOST'];

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { opportunities, updateOpportunity, loadOpportunities } = useOpportunityStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { projects, loadProjects } = useProjectStore();
  const { user: _user } = useAuthStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>(DEFAULT_REJECTION_REASONS[0].value);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
    loadProjects();
    const fetchUsers = async () => {
      const allUsers = await db.getUsers();
      setUsers(allUsers);
    };
    fetchUsers();
  }, [loadOpportunities, loadCustomers, loadProjects]);

  const opportunity = useMemo(() => opportunities.find(o => o.id === id), [opportunities, id]);
  
  if (!opportunity) {
    return <div className="page-container p-8 text-center text-gray-500">Đang tải...</div>;
  }

  const customer = customers.find(c => c.id === opportunity.customer_id);
  const project = projects.find(p => p.id === opportunity.project_id);
  const assignedSale = users.find(u => u.id === opportunity.assigned_sale_id);
  
  const currentStatusIndex = STATUS_ORDER.indexOf(opportunity.status);
  const nextStatus = currentStatusIndex > -1 && currentStatusIndex < 3 ? STATUS_ORDER[currentStatusIndex + 1] : null;

  const handleNextStatus = async () => {
    if (nextStatus) {
      await updateOpportunity(opportunity.id, { status: nextStatus as any });
    }
  };

  const handleWin = async () => {
    await updateOpportunity(opportunity.id, { status: 'WON' });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOpportunity(opportunity.id, { 
      status: 'LOST',
      rejection_reason_id: rejectionReason,
      rejection_notes: rejectionNote
    });
    setIsRejectModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="mb-4">
        <button className="flex items-center text-gray-500 hover:text-gray-800 transition-colors" onClick={() => navigate('/opportunities')}>
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </button>
      </div>
      
      <div className="page-header items-start">
        <div>
          <h1 className="page-title text-2xl flex items-center gap-3">
            {opportunity.opportunity_code}
            <StatusBadge status={opportunity.status} labels={OPPORTUNITY_STATUS_LABELS} colors={OPPORTUNITY_STATUS_COLORS} />
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${PRIORITY_COLORS[opportunity.priority]}-100 text-${PRIORITY_COLORS[opportunity.priority]}-800`}>
              {PRIORITY_LABELS[opportunity.priority]}
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Khách hàng: <span className="font-medium text-gray-800">{customer?.customer_name || '-'}</span></p>
        </div>
        <div className="flex gap-2">
          {nextStatus && (
            <button className="btn btn-secondary" onClick={handleNextStatus}>
              Chuyển "{OPPORTUNITY_STATUS_LABELS[nextStatus as keyof typeof OPPORTUNITY_STATUS_LABELS]}" <ArrowRight size={16} className="ml-1" />
            </button>
          )}
          {opportunity.status === 'NEGOTIATING' && (
            <button className="btn bg-green-600 hover:bg-green-700 text-white" onClick={handleWin}>
              <CheckCircle size={18} className="mr-2" /> Chốt Đơn
            </button>
          )}
          {currentStatusIndex >= 1 && currentStatusIndex < 4 && (
            <button className="btn bg-red-100 hover:bg-red-200 text-red-700" onClick={() => setIsRejectModalOpen(true)}>
              <XCircle size={18} className="mr-2" /> Từ chối
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setIsEditFormOpen(true)}>
            <Edit size={18} className="mr-2" /> Sửa
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center relative py-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          {STATUS_ORDER.map((status, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isLost = status === 'LOST';
            const isWon = status === 'WON';
            
            if (isLost && opportunity.status !== 'LOST') return null;
            if (isWon && opportunity.status === 'LOST') return null;

            return (
              <div key={status} className="relative z-10 flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2
                  ${isLost ? 'bg-red-500 text-white border-red-500' : ''}
                  ${isWon && isCompleted ? 'bg-green-500 text-white border-green-500' : ''}
                  ${!isLost && (!isWon || !isCompleted) && isCurrent ? 'bg-blue-600 text-white border-blue-600' : ''}
                  ${!isLost && (!isWon || !isCompleted) && isCompleted && !isCurrent ? 'bg-blue-100 text-blue-600 border-blue-600' : ''}
                  ${!isLost && !isCompleted ? 'bg-white text-gray-400 border-gray-300' : ''}
                `}>
                  {index + 1}
                </div>
                <div className={`text-xs mt-2 font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                  {OPPORTUNITY_STATUS_LABELS[status as keyof typeof OPPORTUNITY_STATUS_LABELS]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông tin chung</h3>
          <div className="space-y-3">
            <div className="flex">
              <span className="text-gray-500 w-1/3">Khách hàng:</span>
              <span className="font-medium text-gray-800">{customer?.customer_name || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-1/3">Dự án:</span>
              <span className="font-medium text-gray-800">{project?.project_name || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-1/3">Sale phụ trách:</span>
              <span className="font-medium text-gray-800">{assignedSale?.full_name || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-1/3">Ngày tiếp nhận:</span>
              <span className="font-medium text-gray-800">{formatDate(opportunity.received_date)}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-1/3">Ngày DK chốt:</span>
              <span className="font-medium text-gray-800">{opportunity.expected_close_date ? formatDate(opportunity.expected_close_date) : '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-1/3">Giá trị dự kiến:</span>
              <span className="font-bold text-blue-700">{formatVND(opportunity.estimated_value || 0)}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Chi tiết nhu cầu</h3>
          <div className="space-y-4">
            <div>
              <span className="text-gray-500 block mb-1">Nhu cầu:</span>
              <div className="bg-gray-50 p-3 rounded border text-gray-800 min-h-[60px] whitespace-pre-wrap">
                {opportunity.requirements || 'Chưa có thông tin'}
              </div>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Ghi chú:</span>
              <div className="bg-gray-50 p-3 rounded border text-gray-800 min-h-[60px] whitespace-pre-wrap">
                {opportunity.notes || 'Không có ghi chú'}
              </div>
            </div>
            {opportunity.rejection_reason_id && (
              <div>
                <span className="text-red-500 block mb-1 font-medium">Lý do thất bại:</span>
                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 whitespace-pre-wrap">
                  {DEFAULT_REJECTION_REASONS.find(r => r.value === opportunity.rejection_reason_id)?.label || opportunity.rejection_reason_id}
                  {opportunity.rejection_notes && ` - ${opportunity.rejection_notes}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card min-h-[200px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Báo giá</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">Chưa có báo giá nào</p>
            <p className="text-sm">Tính năng tạo Báo giá sẽ có ở Phase 2</p>
          </div>
        </div>
      </div>

      {isEditFormOpen && (
        <OpportunityForm 
          isOpen={isEditFormOpen} 
          onClose={() => setIsEditFormOpen(false)} 
          opportunity={opportunity} 
        />
      )}

      {isRejectModalOpen && (
        <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Từ chối Cơ hội">
          <form onSubmit={handleReject}>
            <div className="mb-4">
              <label className="form-label text-red-600">Xác nhận chuyển cơ hội này sang trạng thái "Thất bại"?</label>
            </div>
            <div className="form-group">
              <label className="form-label">Lý do từ chối <span className="text-red-500">*</span></label>
              <select 
                className="form-input"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                {DEFAULT_REJECTION_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú thêm</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Nhập chi tiết lý do..."
              />
            </div>
            <div className="modal-footer mt-6">
              <button type="button" className="btn btn-secondary" onClick={() => setIsRejectModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn bg-red-600 text-white hover:bg-red-700">Xác nhận Từ chối</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
