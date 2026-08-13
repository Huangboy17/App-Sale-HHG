import React from 'react';

interface StockIndicatorProps {
  available: number;
  requested?: number;
  total?: number;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  available,
  requested = 0,
  total: _total
}) => {
  let label = 'Còn hàng';
  let color = 'success';

  if (available === 0) {
    label = 'Hết hàng';
    color = 'danger';
  } else if (requested > available) {
    label = 'Không đủ hàng';
    color = 'warning';
  }

  return (
    <div className="stock-indicator">
      <div className={`status-dot bg-${color}`} />
      <span className={`text-${color} font-medium`}>{label}</span>
      <span className="stock-value text-sm text-gray-500 ml-2">({available} có sẵn)</span>
      {requested > available && available > 0 && (
        <span className="stock-warning text-sm text-danger ml-2">Cần đặt thêm {requested - available}</span>
      )}
    </div>
  );
};
