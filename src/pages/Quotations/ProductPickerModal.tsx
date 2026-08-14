import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Search } from 'lucide-react';
import { db } from '../../lib/database';
import type { Product } from '../../lib/types';
import { formatVND, formatNumber } from '../../lib/formatters';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  excludeProductIds?: string[];
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeProductIds = [],
}: ProductPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allProducts = db.getProducts();
      setProducts(allProducts);
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      if (excludeProductIds.includes(p.id)) return false;
      if (!showOutOfStock && p.stock_quantity <= 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.product_code.toLowerCase().includes(q) &&
          !p.product_name.toLowerCase().includes(q) &&
          !(p.brand && p.brand.toLowerCase().includes(q))
        ) return false;
      }

      return true;
    });
  }, [products, searchQuery, showOutOfStock, excludeProductIds]);

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '2px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chọn sản phẩm" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo Mã SP, Tên SP, Hãng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
            />
            Hiển thị cả SP hết tồn
          </label>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg-surface-light)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface-light)', zIndex: 1 }}>
              <tr>
                <th style={thStyle}>Mã SP</th>
                <th style={thStyle}>Tên SP</th>
                <th style={thStyle}>Hãng</th>
                <th style={thStyle}>ĐVT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Giá NY sau VAT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Giá DP</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tồn kho</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isAvailable = p.stock_quantity > 0;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => { onSelect(p); onClose(); }}
                      style={{
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary)' }}>{p.product_code}</td>
                      <td style={tdStyle}>{p.product_name}</td>
                      <td style={tdStyle}>{p.brand || '-'}</td>
                      <td style={tdStyle}>{p.unit}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(p.base_price)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatVND(p.dp_price)}</td>
                      <td style={{
                        ...tdStyle,
                        textAlign: 'right',
                        fontWeight: 600,
                      }}>
                        {formatNumber(p.stock_quantity)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                          {isAvailable ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
