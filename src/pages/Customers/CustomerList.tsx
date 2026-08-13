import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import type { Customer, User } from '../../lib/types';
import { CUSTOMER_SOURCES } from '../../lib/constants';
import { db } from '../../lib/database';
import { DataTable } from '../../components/common/DataTable';
import CustomerForm from './CustomerForm';

export default function CustomerList() {
  const { customers, loading, loadCustomers } = useCustomerStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadCustomers();
    const fetchUsers = async () => {
      const allUsers = await db.getUsers();
      setUsers(allUsers);
    };
    fetchUsers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        c.customer_name.toLowerCase().includes(searchLower) ||
        (c.company_name?.toLowerCase().includes(searchLower) || false) ||
        (c.phone?.includes(searchTerm) || false)
      );
    });
  }, [customers, searchTerm]);

  const columns = [
    { label: 'Tên KH', key: 'customer_name', sortable: true },
    { label: 'Công ty', key: 'company_name', sortable: true },
    { label: 'Người liên hệ', key: 'contact_person' },
    { label: 'SĐT', key: 'phone' },
    { label: 'Email', key: 'email' },
    { 
      label: 'Nguồn', 
      key: 'source',
      render: (_, row: Customer) => {
        const source = CUSTOMER_SOURCES.find(s => s.value === row.source);
        return source ? source.label : row.source;
      }
    },
    { 
      label: 'Sale phụ trách', 
      key: 'assigned_sale_id',
      render: (_, row: Customer) => users.find(u => u.id === row.assigned_sale_id)?.full_name || '-'
    },
  ];

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Danh sách Khách hàng</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={20} className="mr-2" />
          Thêm khách hàng
        </button>
      </div>

      <div className="filter-bar card">
        <div className="search-box w-full max-w-md">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, công ty, SĐT..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filteredCustomers}
          isLoading={loading}
          onRowClick={handleRowClick}
        />
      </div>

      {isFormOpen && (
        <CustomerForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
