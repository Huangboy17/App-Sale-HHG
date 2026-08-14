import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import type { Transaction, Customer, TransactionStatus } from '../../lib/types';
import { DataTable } from '../../components/common/DataTable';

type TransactionWithCustomer = Transaction & { customer_name: string };

export default function CustomerList() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithCustomer[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionStatus>('TRACKING');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const trxs = await transactionService.getAll();
        const custs = await customerService.getAll();

        const customerMap = new Map<string, string>();
        custs.forEach(c => customerMap.set(c.id, c.customer_name));

        const enriched = trxs.map(t => ({
          ...t,
          customer_name: customerMap.get(t.customer_id) || 'Không xác định'
        }));
        
        setTransactions(enriched);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      const matchTab = t.status === activeTab;
      const matchSearch = t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.project_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [transactions, activeTab, searchTerm]);

  const columns = [
    { label: 'Khách hàng', key: 'customer_name', sortable: true },
    { label: 'Công trình', key: 'project_name', sortable: true },
    { label: 'Trạng thái', key: 'status' },
    { 
      label: 'Giá trị dự kiến', 
      key: 'expected_value',
      render: (val: unknown) => {
        const num = Number(val);
        return isNaN(num) ? '-' : `${num.toLocaleString('vi-VN')} ₫`;
      }
    },
    { label: 'Next Action', key: 'next_action', render: (val: unknown) => val ? String(val) : '-' }
  ];

  const handleRowClick = (row: TransactionWithCustomer) => {
    navigate(`/transactions/${row.id}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Khách hàng / Giao dịch</h1>
      </div>

      <div className="card" style={{ padding: '0', marginBottom: '1.5rem', backgroundColor: '#0D1729', borderColor: '#1E293B', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #1E293B' }}>
          {[
            { id: 'TRACKING', label: 'ĐANG THEO DÕI' },
            { id: 'WON', label: 'ĐÃ CHỐT' },
            { id: 'LOST', label: 'TỪ CHỐI' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TransactionStatus)}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: activeTab === tab.id ? '#1E293B' : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#fff' : '#9CA3AF',
                fontWeight: activeTab === tab.id ? 500 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '1rem', borderBottom: '1px solid #1E293B' }}>
          <div className="search-box" style={{ width: '100%', maxWidth: '400px' }}>
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo khách hàng, công trình..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ backgroundColor: '#0D1729', borderColor: '#1E293B' }}>
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}
