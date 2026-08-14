// ============================================================
// Excel Export Utilities for Quotation Dispatch (Hold & Order)
// ============================================================

import * as XLSX from 'xlsx';
import type { SaleQuotation, QuotationDispatchSummary, Customer } from './types';
import { formatDate } from './formatters';

export function exportHoldItemsExcel(
  quotation: SaleQuotation,
  customer: Customer | undefined,
  dispatchSummary: QuotationDispatchSummary,
  saleName?: string
): void {
  const holdItems = dispatchSummary.items.filter((i) => i.hold_quantity > 0);
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    ['BẢNG ĐIỀU PHỐI HÀNG - DANH SÁCH GIỮ HÀNG'],
    [''],
    ['Khách hàng:', customer?.customer_name || 'Khách hàng'],
    ['Mã báo giá:', quotation.quotation_code],
    ['Ngày báo giá:', formatDate(quotation.quotation_date)],
    ['Ngày chốt đơn:', formatDate(dispatchSummary.closed_at)],
    ['Người phụ trách:', saleName || 'Chưa phân công'],
    ['Ghi chú:', quotation.note || ''],
    [''],
    [
      'STT',
      'Mã SP',
      'Tên sản phẩm',
      'ĐVT',
      'SL khách đặt',
      'Tồn kho tại thời điểm chốt',
      'SL giữ hàng',
      'Ghi chú',
    ],
    ...holdItems.map((item, idx) => [
      idx + 1,
      item.product_code,
      item.product_name,
      item.unit,
      item.ordered_quantity,
      item.stock_snapshot,
      item.hold_quantity,
      item.notes || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 16 }, // Mã SP
    { wch: 38 }, // Tên SP
    { wch: 10 }, // ĐVT
    { wch: 15 }, // SL khách đặt
    { wch: 26 }, // Tồn kho tại thời điểm chốt
    { wch: 15 }, // SL giữ hàng
    { wch: 25 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Giữ hàng');
  XLSX.writeFile(wb, `Giu_hang_${quotation.quotation_code}.xlsx`);
}

export function exportOrderItemsExcel(
  quotation: SaleQuotation,
  customer: Customer | undefined,
  dispatchSummary: QuotationDispatchSummary,
  saleName?: string
): void {
  const orderItems = dispatchSummary.items.filter((i) => i.needed_quantity > 0);
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    ['BẢNG ĐIỀU PHỐI HÀNG - DANH SÁCH ĐẶT HÀNG'],
    [''],
    ['Khách hàng:', customer?.customer_name || 'Khách hàng'],
    ['Mã báo giá:', quotation.quotation_code],
    ['Ngày báo giá:', formatDate(quotation.quotation_date)],
    ['Ngày chốt đơn:', formatDate(dispatchSummary.closed_at)],
    ['Người phụ trách:', saleName || 'Chưa phân công'],
    ['Ghi chú:', quotation.note || ''],
    [''],
    [
      'STT',
      'Mã SP',
      'Tên sản phẩm',
      'ĐVT',
      'SL khách đặt',
      'Tồn kho tại thời điểm chốt',
      'SL có thể đáp ứng',
      'SL cần đặt',
      'Ghi chú',
    ],
    ...orderItems.map((item, idx) => [
      idx + 1,
      item.product_code,
      item.product_name,
      item.unit,
      item.ordered_quantity,
      item.stock_snapshot,
      Math.max(0, item.stock_snapshot),
      item.needed_quantity,
      item.notes || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 16 }, // Mã SP
    { wch: 38 }, // Tên SP
    { wch: 10 }, // ĐVT
    { wch: 15 }, // SL khách đặt
    { wch: 26 }, // Tồn kho tại thời điểm chốt
    { wch: 18 }, // SL có thể đáp ứng
    { wch: 15 }, // SL cần đặt
    { wch: 25 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Đặt hàng');
  XLSX.writeFile(wb, `Dat_hang_${quotation.quotation_code}.xlsx`);
}
