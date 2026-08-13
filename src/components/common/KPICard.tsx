import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  variant = 'primary'
}) => {
  return (
    <div className={`kpi-card bg-${variant}-gradient`}>
      <div className="kpi-header">
        <h3 className="kpi-label">{label}</h3>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        {trend !== undefined && (
          <div className={`kpi-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend)}% {trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
