import React from 'react';

interface StatusBadgeProps {
  status: string;
  labels: Record<string, string>;
  colors?: Record<string, string>;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  labels,
  colors = {},
  size = 'md',
  dot = false
}) => {
  const label = labels[status] || status;
  const colorClass = colors[status] || 'default';

  return (
    <span className={`badge badge-${size} badge-${colorClass}`}>
      {dot && <span className={`badge-dot bg-${colorClass}`} />}
      {label}
    </span>
  );
};
