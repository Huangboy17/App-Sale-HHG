import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, FileUp, PackageOpen, Download } from 'lucide-react';
import { useProductStore } from '../../stores/productStore';
import type { Product } from '../../lib/types';
import { formatVND, formatNumber } from '../../lib/formatters';
import { DataTable } from '../../components/common/DataTable';
import ProductForm from './ProductForm';
import ImportExcelModal from './ImportExcelModal';
import { downloadExcelTemplate } from '../../lib/excelImport';

const STOCK_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả mức tồn' },
  { value: 'in_stock', label: 'Tồn nhiều (>10)' },
  { value: 'low_stock', label: 'Sắp hết (1-10)' },
  { value: 'out_of_stock', label: 'Hết hàng (0)' },
];

export default function ProductList() {
  const { products, loading, loadProducts, brands, groups, importPriceListFile, importInventoryFile } = useProductStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('all');

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'price' | 'inventory'>('price');

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
      let matchStatus = true;
      if (filterStatus === 'available') matchStatus = p.stock_quantity > 0;
      else if (filterStatus === 'out_of_stock') matchStatus = p.stock_quantity <= 0;
      else if (filterStatus) matchStatus = p.status === filterStatus;

      let matchStock = true;
      if (filterStock === 'in_stock') matchStock = p.stock_quantity > 10;
      else if (filterStock === 'low_stock') matchStock = p.stock_quantity >= 1 && p.stock_quantity <= 10;
      else if (filterStock === 'out_of_stock') matchStock = p.stock_quantity === 0;

      return matchSearch && matchBrand && matchGroup && matchStatus && matchStock;
    });
  }, [products, searchTerm, filterBrand, filterGroup, filterStatus, filterStock]);

  const columns = [
    { label: 'Mã SP', key: 'product_code' as keyof Product, sortable: true },
    { label: 'Tên sản phẩm', key: 'product_name' as keyof Product, sortable: true },
    { label: 'Hãng', key: 'brand' as keyof Product },
    { label: 'Nhóm', key: 'product_group' as keyof Product },
    { label: 'ĐVT', key: 'unit' as keyof Product },
    { 
      label: 'Giá NY sau VAT', 
      key: 'base_price' as keyof Product,
      sortable: true,
      render: (_val: unknown, p: Product) => formatVND(p.base_price)
    },
    { 
      label: 'Giá DP', 
      key: 'dp_price' as keyof Product,
      sortable: true,
      render: (_val: unknown, p: Product) => formatVND(p.dp_price ?? p.base_price)
    },
    { 
      label: 'Tồn kho', 
      key: 'stock_quantity' as keyof Product,
      sortable: true,
      render: (_val: unknown, p: Product) => (
        <span style={{ fontWeight: 600 }}>{formatNumber(p.stock_quantity)}</span>
      )
    },
    { 
      label: 'Tình trạng', 
      key: 'stock_quantity' as keyof Product,
      sortable: true,
      render: (_val: unknown, p: Product) => {
        const isAvailable = p.stock_quantity > 0;
        return (
          <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
            {isAvailable ? 'Còn hàng' : 'Hết hàng'}
          </span>
        );
      }
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

  const openImportModal = (type: 'price' | 'inventory') => {
    setImportType(type);
    setImportModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Sản phẩm & Tồn kho</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => downloadExcelTemplate('price')}
            title="Tải file Excel mẫu cho Bảng giá"
          >
            <Download size={16} />
            Mẫu Bảng giá
          </button>
          <button
            className="btn btn-outline"
            onClick={() => downloadExcelTemplate('inventory')}
            title="Tải file Excel mẫu cho Tồn kho"
          >
            <Download size={16} />
            Mẫu Tồn kho
          </button>
          <button
            className="btn btn-outline"
            onClick={() => openImportModal('price')}
            title="Import danh mục sản phẩm & giá từ file Excel"
          >
            <FileUp size={18} />
            Import bảng giá
          </button>
          <button
            className="btn btn-outline"
            onClick={() => openImportModal('inventory')}
            title="Import số lượng tồn kho từ file Excel"
          >
            <PackageOpen size={18} />
            Import tồn kho
          </button>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="filter-bar card">
        <div className="search-box">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên sản phẩm..."
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
          <option value="">Tất cả tình trạng</option>
          <option value="available">Còn hàng</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
        <select
          className="form-input"
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
        >
          {STOCK_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading && <div className="text-muted mb-4">Đang tải...</div>}
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

      {importModalOpen && (
        <ImportExcelModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          type={importType}
          onImport={importType === 'price' ? importPriceListFile : importInventoryFile}
        />
      )}
    </div>
  );
}
