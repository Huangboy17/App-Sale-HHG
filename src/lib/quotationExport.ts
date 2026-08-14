// ============================================================
// Quotation / Order Confirmation Export Utilities (PDF & Excel)
// ============================================================

import * as XLSX from 'xlsx';
import type { SaleQuotation, SaleQuotationItem, Customer, User, QuotationTerm } from './types';
import { formatDate, formatVND, formatNumber } from './formatters';

export const COMPANY_INFO = {
  name: 'CÔNG TY TNHH HHG HOLDINGS',
  address: 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
  hotline: '+84 243 821 6666',
  website: 'www.hhg.vn',
  email: 'info@hhg.vn',
  defaultSaleName: 'Nguyễn Thị Hương',
  defaultSalePhone: '0978322208',
  defaultSaleEmail: 'huongnt@hhg.vn',
};

export const DEFAULT_QUOTATION_TERMS: QuotationTerm[] = [
  {
    id: 'term-1',
    term_title: 'Đơn giá',
    term_content: '• Đơn giá được tính bằng VNĐ.\n• Đã bao gồm thuế VAT và chưa bao gồm chi phí lắp đặt.\n• Khối lượng là tạm tính, giá trị thanh toán là khối lượng giao nhận thực tế.',
    display_order: 1,
    is_visible: true,
  },
  {
    id: 'term-2',
    term_title: 'Điều khoản thanh toán',
    term_content: '• Đặt cọc 50% giá trị đơn hàng.\n• Thanh toán nốt 50% giá trị còn lại trước khi giao hàng.',
    display_order: 2,
    is_visible: true,
  },
  {
    id: 'term-3',
    term_title: 'Địa chỉ giao hàng',
    term_content: 'Hà Nội.',
    display_order: 3,
    is_visible: true,
  },
  {
    id: 'term-4',
    term_title: 'Chi phí vận chuyển',
    term_content: 'Miễn phí giao hàng đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội.',
    display_order: 4,
    is_visible: true,
  },
  {
    id: 'term-5',
    term_title: 'Tiến độ giao hàng',
    term_content: '• Lần 1: Giao phần hàng có sẵn sau 5–7 ngày kể từ ngày nhận tạm ứng.\n• Lần 2: Giao nốt hàng hóa còn lại sau 120–150 ngày kể từ ngày nhận tạm ứng.',
    display_order: 5,
    is_visible: true,
  },
  {
    id: 'term-6',
    term_title: 'Bảo hành',
    term_content: 'Bảo hành 24 tháng chính hãng theo tiêu chuẩn của nhà sản xuất.',
    display_order: 6,
    is_visible: true,
  },
];

// Sanitize filename to remove special characters and accents for safe file downloading
export function sanitizeFileName(name: string): string {
  if (!name) return '';
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
  return normalized
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function getQuotationBaseFileName(
  quotation: SaleQuotation,
  customer?: Customer,
  docTitle = 'Xac_nhan_don_hang'
): string {
  const customerPart = customer
    ? sanitizeFileName(customer.customer_name || customer.company_name || '')
    : 'Khach_hang';
  const codePart = sanitizeFileName(quotation.quotation_code);
  const titlePart = sanitizeFileName(docTitle);
  return `${titlePart}_${codePart}_${customerPart}`;
}

// ------------------------------------------------------------
// 1. EXCEL EXPORT
// ------------------------------------------------------------
export function exportQuotationExcel(
  quotation: SaleQuotation,
  customer: Customer | undefined,
  items: SaleQuotationItem[],
  saleUser?: User | string,
  docTitle = 'XÁC NHẬN ĐƠN HÀNG',
  customTerms?: QuotationTerm[]
): void {
  const wb = XLSX.utils.book_new();
  const fileName = `${getQuotationBaseFileName(quotation, customer, docTitle)}.xlsx`;

  const customerName = (customer?.customer_name || customer?.company_name || 'Khách hàng').toUpperCase();
  const customerCode = customer?.tax_code || '';
  const address = customer?.address || customer?.company_name || '-';
  const phone = customer?.phone || '-';
  const contactPerson = (customer?.contact_person || customer?.customer_name || '-').toUpperCase();

  const saleFullName = typeof saleUser === 'object' ? saleUser?.full_name : saleUser || COMPANY_INFO.defaultSaleName;
  const salePhone = typeof saleUser === 'object' ? saleUser?.phone || COMPANY_INFO.defaultSalePhone : COMPANY_INFO.defaultSalePhone;
  const saleEmail = typeof saleUser === 'object' ? saleUser?.email || COMPANY_INFO.defaultSaleEmail : COMPANY_INFO.defaultSaleEmail;

  const termsToUse = customTerms || quotation.terms || DEFAULT_QUOTATION_TERMS;
  const visibleTerms = termsToUse.filter((t) => t.is_visible && t.term_content?.trim());

  const data: (string | number)[][] = [
    [docTitle],
    ['', '', '', '', '', '', '', 'Số ĐH:', quotation.quotation_code],
    ['', '', '', '', '', '', '', 'Ngày:', formatDate(quotation.quotation_date)],
    [''],
    ['THÔNG TIN KHÁCH HÀNG', '', '', '', 'THÔNG TIN CÔNG TY'],
    [
      'KHÁCH HÀNG:',
      `${customerName}${customerCode ? ` - ${customerCode}` : ''}`,
      '',
      '',
      COMPANY_INFO.name,
    ],
    ['ĐỊA CHỈ/CÔNG TRÌNH:', address, '', '', `ĐỊA CHỈ: ${COMPANY_INFO.address}`],
    ['SỐ ĐIỆN THOẠI:', phone, '', '', `Hotline: ${COMPANY_INFO.hotline} | Website: ${COMPANY_INFO.website}`],
    ['NGƯỜI LIÊN HỆ:', contactPerson, '', '', `Email: ${COMPANY_INFO.email}`],
    ['', '', '', '', `PHỤ TRÁCH: ${saleFullName} - Mobile: ${salePhone}`],
    ['', '', '', '', `Email: ${saleEmail}`],
    [''],
    ['“Thay mặt Công ty, xin hân hạnh gửi đến quý khách báo giá gồm các hạng mục như sau:”'],
    [''],
    [
      'STT',
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Hãng',
      'ĐVT',
      'Số lượng',
      'Đơn giá (VNĐ)',
      'Thành tiền (VNĐ)',
      'Ghi chú',
    ],
    ...items.map((item, idx) => [
      idx + 1,
      item.product_code,
      item.product_name,
      item.brand || '',
      item.unit,
      item.quantity,
      item.sale_price,
      item.amount,
      item.note || '',
    ]),
    [''],
    ['', '', '', '', '', '', 'TỔNG CỘNG THANH TOÁN (VNĐ):', quotation.total_amount, ''],
    [''],
    ['CÁC ĐIỀU KHOẢN KÈM THEO:'],
    ...visibleTerms.map((term, idx) => [
      `${idx + 1}. ${term.term_title}:`,
      term.term_content,
    ]),
    ...(quotation.note ? [['Ghi chú thêm:', quotation.note]] : []),
    [''],
    ['Chân thành cám ơn Quý khách!'],
    [''],
    [''],
    ['ĐẠI DIỆN KHÁCH HÀNG', '', '', '', '', '', 'ĐẠI DIỆN BÁN HÀNG'],
    ['(Ký, ghi rõ họ tên)', '', '', '', '', '', '(Ký, ghi rõ họ tên)'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 16 }, // Mã sản phẩm
    { wch: 38 }, // Tên sản phẩm
    { wch: 15 }, // Hãng
    { wch: 10 }, // ĐVT
    { wch: 12 }, // Số lượng
    { wch: 18 }, // Đơn giá
    { wch: 22 }, // Thành tiền
    { wch: 25 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Don_Hang');
  XLSX.writeFile(wb, fileName);
}

// ------------------------------------------------------------
// 2. PDF / PRINT EXPORT HTML GENERATOR
// ------------------------------------------------------------
export function generateQuotationPrintHTML(
  quotation: SaleQuotation,
  customer: Customer | undefined,
  items: SaleQuotationItem[],
  saleUser?: User | string,
  docTitle = 'XÁC NHẬN ĐƠN HÀNG',
  customTerms?: QuotationTerm[]
): string {
  const customerName = (customer?.customer_name || customer?.company_name || 'Khách hàng').toUpperCase();
  const customerCode = customer?.tax_code || '';
  const address = customer?.address || customer?.company_name || '-';
  const phone = customer?.phone || '-';
  const contactPerson = (customer?.contact_person || customer?.customer_name || '-').toUpperCase();

  const saleFullName = typeof saleUser === 'object' ? saleUser?.full_name : saleUser || COMPANY_INFO.defaultSaleName;
  const salePhone = typeof saleUser === 'object' ? saleUser?.phone || COMPANY_INFO.defaultSalePhone : COMPANY_INFO.defaultSalePhone;
  const saleEmail = typeof saleUser === 'object' ? saleUser?.email || COMPANY_INFO.defaultSaleEmail : COMPANY_INFO.defaultSaleEmail;

  const termsToUse = customTerms || quotation.terms || DEFAULT_QUOTATION_TERMS;
  const visibleTerms = termsToUse.filter((t) => t.is_visible && t.term_content?.trim());

  const tableRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 600; color: #1e3a8a;">${item.product_code}</td>
        <td style="font-weight: 500;">${item.product_name}</td>
        <td style="color: #334155; font-weight: 500;">${item.brand || ''}</td>
        <td style="text-align: center;">${item.unit}</td>
        <td style="text-align: right; font-weight: 600;">${formatNumber(item.quantity)}</td>
        <td style="text-align: right; font-weight: 600;">${formatVND(item.sale_price)}</td>
        <td style="text-align: right; font-weight: 700; color: #0f766e;">${formatVND(item.amount)}</td>
        <td style="color: #64748b; font-size: 11.5px;">${item.note || ''}</td>
      </tr>
    `
    )
    .join('');

  const termsHTML = visibleTerms
    .map(
      (term, idx) => `
      <div style="margin-bottom: 8px;">
        <strong style="color: #0f172a;">${idx + 1}. ${term.term_title}:</strong>
        <div style="white-space: pre-line; margin-top: 2px; padding-left: 12px; color: #334155;">${term.term_content}</div>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${docTitle} ${quotation.quotation_code} - ${customerName}</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1e293b;
          background: #fff;
          font-size: 13px;
          line-height: 1.45;
          padding: 20px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #0f766e;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .main-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .order-meta {
          text-align: right;
        }
        .order-number {
          font-size: 13px;
          font-weight: 700;
          color: #0f766e;
        }
        .order-date {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 14px;
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .info-col h4 {
          font-size: 12px;
          color: #0f766e;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 800;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
        }
        .info-row {
          display: flex;
          margin-bottom: 3px;
          font-size: 12px;
          line-height: 1.5;
        }
        .info-label {
          color: #64748b;
          font-weight: 600;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .info-value {
          font-weight: 600;
          color: #1e293b;
        }
        .intro-text {
          margin-bottom: 12px;
          font-style: italic;
          color: #334155;
          font-size: 12.5px;
          padding-left: 2px;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        table.items-table th {
          background: #0f766e;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 8px 6px;
          border: 1px solid #0f766e;
        }
        table.items-table td {
          padding: 7px 6px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
        }
        table.items-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .total-box {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 18px;
        }
        .total-card {
          width: 340px;
          background: #f0fdf4;
          border: 1.5px solid #10b981;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 700;
          color: #065f46;
        }
        .terms-block {
          margin-bottom: 20px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3.5px solid #0f766e;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.5;
        }
        .terms-header {
          font-size: 12.5px;
          font-weight: 800;
          color: #0f766e;
          text-transform: uppercase;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .thank-you {
          text-align: right;
          font-style: italic;
          font-weight: 700;
          color: #0f766e;
          font-size: 13px;
          margin-bottom: 24px;
          padding-right: 10px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 0 40px;
          page-break-inside: avoid;
        }
        .sig-block {
          text-align: center;
          width: 220px;
        }
        .sig-title {
          font-weight: 700;
          font-size: 12.5px;
          text-transform: uppercase;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .sig-space {
          height: 65px;
        }
        .sig-name {
          font-weight: 600;
          font-size: 12px;
          color: #1e293b;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <!-- 1. Header Top: Tên chứng từ & Số ĐH + Ngày -->
      <div class="header-top">
        <div>
          <div class="main-title">${docTitle}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            HỆ THỐNG QUẢN LÝ BÁN HÀNG HHG
          </div>
        </div>
        <div class="order-meta">
          <div class="order-number">Số ĐH: <span style="color: #0f172a;">${quotation.quotation_code}</span></div>
          <div class="order-date">Ngày: <strong style="color: #0f172a;">${formatDate(quotation.quotation_date)}</strong></div>
        </div>
      </div>

      <!-- 2. Khu vực 2 cột song song: Thông tin khách hàng | Thông tin công ty -->
      <div class="info-grid">
        <!-- Cột trái: Thông tin khách hàng -->
        <div class="info-col">
          <h4>THÔNG TIN KHÁCH HÀNG</h4>
          <div class="info-row">
            <span class="info-label">KHÁCH HÀNG:</span>
            <span class="info-value">${customerName}${customerCode ? ` - ${customerCode}` : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ĐỊA CHỈ/CÔNG TRÌNH:</span>
            <span class="info-value">${address}</span>
          </div>
          <div class="info-row">
            <span class="info-label">SỐ ĐIỆN THOẠI:</span>
            <span class="info-value">${phone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NGƯỜI LIÊN HỆ:</span>
            <span class="info-value">${contactPerson}</span>
          </div>
        </div>

        <!-- Cột phải: Thông tin công ty -->
        <div class="info-col">
          <h4>THÔNG TIN CÔNG TY</h4>
          <div style="font-size: 12px; line-height: 1.55;">
            <div style="font-weight: 800; color: #0f766e;">${COMPANY_INFO.name}</div>
            <div><span class="info-label">ĐỊA CHỈ:</span> ${COMPANY_INFO.address}</div>
            <div><span class="info-label">Hotline:</span> ${COMPANY_INFO.hotline} | <span class="info-label">WEBSITE:</span> ${COMPANY_INFO.website}</div>
            <div><span class="info-label">Email:</span> ${COMPANY_INFO.email}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
              <span class="info-label">PHỤ TRÁCH:</span> <strong>${saleFullName}</strong> - Mobile: <strong>${salePhone}</strong>
              <div><span class="info-label">Email:</span> ${saleEmail}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Lời dẫn trước bảng sản phẩm -->
      <div class="intro-text">
        “Thay mặt Công ty, xin hân hạnh gửi đến quý khách báo giá gồm các hạng mục như sau:”
      </div>

      <!-- 4. Bảng sản phẩm: STT → Mã SP → Tên sản phẩm → Hãng → ĐVT → Số lượng → Đơn giá → Thành tiền → Ghi chú -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 32px;">STT</th>
            <th style="width: 85px;">Mã SP</th>
            <th>Tên sản phẩm</th>
            <th style="width: 75px;">Hãng</th>
            <th style="width: 48px; text-align: center;">ĐVT</th>
            <th style="width: 45px; text-align: right;">SL</th>
            <th style="width: 95px; text-align: right;">Đơn giá</th>
            <th style="width: 105px; text-align: right;">Thành tiền</th>
            <th style="width: 110px;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <!-- 5. Tổng tiền -->
      <div class="total-box">
        <div class="total-card">
          <div class="total-row">
            <span>TỔNG CỘNG THANH TOÁN:</span>
            <span>${formatVND(quotation.total_amount)}</span>
          </div>
          <div style="font-size: 11px; color: #065f46; margin-top: 4px; text-align: right;">
            (Giá đã bao gồm thuế GTGT)
          </div>
        </div>
      </div>

      <!-- 6. CÁC ĐIỀU KHOẢN KÈM THEO -->
      <div class="terms-block">
        <div class="terms-header">CÁC ĐIỀU KHOẢN KÈM THEO</div>
        ${termsHTML}
        ${quotation.note ? `<div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;"><strong>Ghi chú bổ sung:</strong> ${quotation.note}</div>` : ''}
      </div>

      <!-- 7. Lời cảm ơn -->
      <div class="thank-you">
        Chân thành cám ơn Quý khách!
      </div>

      <!-- 8. Chữ ký xác nhận 2 bên -->
      <div class="signatures">
        <div class="sig-block">
          <div class="sig-title">ĐẠI DIỆN KHÁCH HÀNG</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${customerName}</div>
        </div>
        <div class="sig-block">
          <div class="sig-title">ĐẠI DIỆN BÁN HÀNG</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${saleFullName}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printQuotationPDF(
  quotation: SaleQuotation,
  customer: Customer | undefined,
  items: SaleQuotationItem[],
  saleUser?: User | string,
  docTitle = 'XÁC NHẬN ĐƠN HÀNG',
  customTerms?: QuotationTerm[]
): void {
  const htmlContent = generateQuotationPrintHTML(quotation, customer, items, saleUser, docTitle, customTerms);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}
