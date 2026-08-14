import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { quotationService } from '../../services/quotationService';
import { contractService } from '../../services/contractService';
import { paymentService } from '../../services/paymentService';
import { activityService } from '../../services/activityService';
import type { Transaction, Customer, Quotation, Contract, Payment, Activity } from '../../lib/types';
import { ArrowLeft } from 'lucide-react';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        // Fetch transaction and customer
        const trx = await transactionService.getById(id);
        if (trx) {
          setTransaction(trx);
          const cust = await customerService.getById(trx.customer_id);
          if (cust) setCustomer(cust);
          
          // Fetch related entities
          const allQuotations = await quotationService.getQuotations();
          setQuotations(allQuotations.filter(q => q.transaction_id === id));
          
          const allContracts = await contractService.getAll();
          const trxContracts = allContracts.filter(c => c.transaction_id === id);
          setContracts(trxContracts);
          
          const allPayments = await paymentService.getAll();
          const contractIds = trxContracts.map(c => c.id);
          setPayments(allPayments.filter(p => contractIds.includes(p.contract_id)));
          
          const trxActivities = await activityService.getByTransactionId(id);
          setActivities(trxActivities);
        }
      };
      fetchData();
    }
  }, [id]);

  if (!transaction || !customer) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  const renderActivities = () => (
    <div className="card" style={{ backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
      <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Lịch sử hoạt động</h3>
      {activities.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {activities.map(act => (
            <li key={act.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E293B' }}>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>{new Date(act.created_at).toLocaleDateString('vi-VN')} - {act.activity_type}</p>
              <p>{act.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">Chưa có lịch sử hoạt động</p>
      )}
    </div>
  );

  const renderRightContent = () => {
    if (transaction.status === 'TRACKING') {
      return (
        <>
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Báo giá</h3>
            {quotations.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Mã báo giá</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id} style={{ borderTop: '1px solid #1E293B' }}>
                      <td style={{ paddingTop: '0.5rem' }}>{q.quotation_code}</td>
                      <td style={{ paddingTop: '0.5rem' }}>{new Date(q.created_at).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400">Chưa có báo giá nào</p>
            )}
          </div>
          {renderActivities()}
        </>
      );
    }
    if (transaction.status === 'WON') {
      return (
        <>
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Hợp đồng</h3>
            {contracts.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Mã hợp đồng</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Giá trị</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid #1E293B' }}>
                      <td style={{ paddingTop: '0.5rem' }}>{c.contract_code}</td>
                      <td style={{ paddingTop: '0.5rem', color: '#3B82F6' }}>{c.contract_value?.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ paddingTop: '0.5rem' }}>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400">Chưa có hợp đồng nào</p>
            )}
          </div>
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Thanh toán</h3>
            {payments.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Ngày thanh toán</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Số tiền</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid #1E293B' }}>
                      <td style={{ paddingTop: '0.5rem' }}>{new Date(p.payment_date).toLocaleDateString('vi-VN')}</td>
                      <td style={{ paddingTop: '0.5rem', color: '#10B981' }}>{p.amount?.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ paddingTop: '0.5rem' }}>Thành công</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400">Chưa có thanh toán nào</p>
            )}
          </div>
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Tồn kho</h3>
            <p className="text-gray-400">Thông tin xuất/nhập kho cho hợp đồng này sẽ hiển thị ở đây.</p>
          </div>
          {renderActivities()}
        </>
      );
    }
    if (transaction.status === 'LOST') {
      return (
        <>
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem', color: '#EF4444' }}>Lý do từ chối</h3>
            <p className="text-gray-400">{transaction.rejection_reason || 'Chưa cập nhật'}</p>
          </div>
          {renderActivities()}
        </>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => navigate('/customers')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Chi tiết giao dịch</h1>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Side: 30% */}
        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Thông tin khách hàng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Tên KH</p>
                <p style={{ fontWeight: 500 }}>{customer.customer_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>SĐT</p>
                <p>{customer.phone || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Email</p>
                <p>{customer.email || '-'}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
            <h3 className="text-lg font-medium" style={{ marginBottom: '1rem' }}>Thông tin giao dịch</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Công trình</p>
                <p style={{ fontWeight: 500 }}>{transaction.project_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Trạng thái</p>
                <p>{transaction.status}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Giá trị dự kiến</p>
                <p style={{ fontWeight: 500, color: '#3B82F6' }}>
                  {transaction.expected_value?.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Hành động tiếp theo</p>
                <p>{transaction.next_action || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 70% */}
        <div style={{ width: '70%' }}>
          {renderRightContent()}
        </div>
      </div>
    </div>
  );
}
