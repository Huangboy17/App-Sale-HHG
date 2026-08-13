import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableColumn } from '../../lib/types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchable = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  emptyMessage = 'Không có dữ liệu',
  actions,
  pageSize = 10
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  const isExternalSearch = onSearchChange !== undefined;
  const currentSearchQuery = isExternalSearch ? searchQuery : internalSearchQuery;
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isExternalSearch && onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (!isExternalSearch && currentSearchQuery) {
      const lowerQuery = currentSearchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerQuery)
        )
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, currentSearchQuery, sortConfig, isExternalSearch]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="data-table-toolbar">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={currentSearchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.key as string)}
                  className={col.sortable ? 'sortable' : ''}
                  style={{ width: col.width }}
                >
                  <div className="th-content">
                    {col.label}
                    {col.sortable && (
                      <span className="sort-icon">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="actions-column" style={{ width: '100px' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render ? col.render(row[col.key as keyof T], row) : row[col.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                  {actions && (
                    <td className="actions-cell" onClick={e => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn-icon" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="page-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button 
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
