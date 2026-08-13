import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useCustomerStore } from '../../stores/customerStore';
import type { Project } from '../../lib/types';
import { formatDate } from '../../lib/formatters';
import { PROJECT_STATUS_LABELS } from '../../lib/constants';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import ProjectForm from './ProjectForm';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'success',
  COMPLETED: 'info',
  CANCELLED: 'danger',
};

export default function ProjectList() {
  const { projects, loading, loadProjects } = useProjectStore();
  const { customers, loadCustomers } = useCustomerStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, [loadProjects, loadCustomers]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      const customerName = customers.find(c => c.id === p.customer_id)?.customer_name || '';
      return (
        p.project_name.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower)
      );
    });
  }, [projects, customers, searchTerm]);

  const columns = [
    { label: 'Tên dự án', key: 'project_name' as keyof Project },
    { 
      label: 'Khách hàng', 
      key: 'customer_id' as keyof Project,
      render: (val: unknown, p: Project) => customers.find(c => c.id === p.customer_id)?.customer_name || '-'
    },
    { label: 'Địa điểm', key: 'location' as keyof Project },
    { label: 'Chủ đầu tư', key: 'investor' as keyof Project },
    { label: 'Tiến độ', key: 'project_progress' as keyof Project },
    { 
      label: 'Ngày cần hàng', 
      key: 'expected_delivery_date' as keyof Project,
      render: (val: unknown, p: Project) => p.expected_delivery_date ? formatDate(p.expected_delivery_date) : '-'
    },
    { 
      label: 'Trạng thái', 
      key: 'status' as keyof Project,
      render: (val: unknown, p: Project) => (
        <StatusBadge 
          status={p.status} 
          labels={PROJECT_STATUS_LABELS} 
          colors={PROJECT_STATUS_COLORS} 
        />
      )
    },
  ];

  const handleRowClick = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProject(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Danh sách Dự án</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={20} className="mr-2" />
          Thêm dự án
        </button>
      </div>

      <div className="filter-bar card">
        <div className="search-box w-full max-w-md">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, khách hàng..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading && <div className="text-gray-500 mb-4">Đang tải...</div>}
        <DataTable
          columns={columns}
          data={filteredProjects}
          onRowClick={handleRowClick}
        />
      </div>

      {isFormOpen && (
        <ProjectForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          project={selectedProject}
        />
      )}
    </div>
  );
}
