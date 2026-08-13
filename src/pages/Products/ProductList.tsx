import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useProductStore } from '../../stores/productStore';
import type { Product } from '../../lib/types';
import { formatVND, formatPercent } from '../../lib/formatters';
import { PRODUCT_STATUS_LABELS } from '../../lib/constants';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StockIndicator } from '../../components/common/StockIndicator';
import ProductForm from './ProductForm';

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  DISCONTINUED: 'danger',
};

export default function ProductList() {
  const { products, loading, loadProducts, brands, groups } = useProductStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = filterBrand ? p.brand === filterBrand : true;
      const matchGroup = filterGroup ? p.product_group === filterGroup : true;
      const matchStatus = filterStatus ? p.status === filterStatus : true;
      return matchSearch && matchBrand && matchGroup && matchStatus;
    });
  }, [products, searchTerm, filterBrand, filterGroup, filterStatus]);

  const columns = [
    { label: 'Mã hàng', key: 'product_code' as keyof Product },
    { label: 'Tên hàng', key: 'product_name' as keyof Product },
    { label: 'Hãng', key: 'brand' as keyof Product },
    { label: 'Nhóm', key: 'product_group' as keyof Product },
    { label: 'ĐVT', key: 'unit' as keyof Product },
    { 
      label: 'Giá gốc', 
      key: 'base_price' as keyof Product,
      render: (_val: unknown, p: Product) => formatVND(p.base_price)
    },
    { 
      label: 'CK tối đa', 
      key: 'max_discount_rate' as keyof Product,
      render: (_val: unknown, p: Product) => formatPercent(p.max_discount_rate)
    },
    { 
      label: 'Giá DP', 
      key: 'base_price' as keyof Product,
      render: (_val: unknown, p: Product) => (
        <span className="font-bold text-primary">
          {formatVND(p.base_price * (1 - p.max_discount_rate / 100))}
        </span>
      )
    },
    { 
      label: 'VAT', 
      key: 'vat_rate' as keyof Product,
      render: (_val: unknown, p: Product) => formatPercent(p.vat_rate)
    },
    { label: 'Tồn kho', key: 'stock_quantity' as keyof Product },
    { label: 'Đang giữ', key: 'reserved_quantity' as keyof Product },
    { 
      label: 'Khả dụng', 
      key: 'stock_quantity' as keyof Product,
      render: (_val: unknown, p: Product) => (
        <StockIndicator 
          available={p.stock_quantity - p.reserved_quantity} 
          total={p.stock_quantity} 
        />
      )
    },
    { 
      label: 'Trạng thái', 
      key: 'status' as keyof Product,
      render: (_val: unknown, p: Product) => (
        <StatusBadge 
          status={p.status} 
          labels={PRODUCT_STATUS_LABELS} 
          colors={PRODUCT_STATUS_COLORS} 
        />
      )
    },
  ];

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Danh mục Sản phẩm</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={20} className="mr-2" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="filter-bar card">
        <div className="search-box">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên hàng..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="form-input"
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
        >
          <option value="">Tất cả hãng</option>
          {brands.map((brand: string) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select 
          className="form-input"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="">Tất cả nhóm</option>
          {groups.map((group: string) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
        <select 
          className="form-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading && <div className="text-gray-500 mb-4">Đang tải...</div>}
        <DataTable
          columns={columns}
          data={filteredProducts}
          onRowClick={handleRowClick}
        />
      </div>

      {isFormOpen && (
        <ProductForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          product={selectedProduct}
        />
      )}
    </div>
 