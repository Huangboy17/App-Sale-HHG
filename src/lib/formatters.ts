import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Format VND currency: 10000000 -> "10.000.000 ₫"
export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with dot separator: 10000 -> "10.000"
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

// Format percentage: 0.15 -> "15%"
export function formatPercent(rate: number | undefined | null): string {
  if (rate === undefined || rate === null) return '0%';
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(rate);
}

// Format date: ISO string -> "13/08/2026"
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'dd/MM/yyyy');
}

// Format datetime: ISO string -> "13/08/2026 14:30"
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'dd/MM/yyyy HH:mm');
}

// Parse VND input: "10.000.000" -> 10000000
export function parseVND(input: string): number {
  if (!input) return 0;
  // Remove non-digit characters except for negative sign
  const numericString = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(numericString, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Format relative time: "2 giờ trước", "Hôm nay"
export function formatRelativeTime(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}
