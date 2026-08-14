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
    term_content: 'Đã bao gồm VAT, chưa bao gồm chi phí lắp đặt. Khối lượng là tạm tính, thanh toán theo khối lượng giao nhận thực tế.',
    display_order: 1,
    is_visible: true,
  },
  {
    id: 'term-2',
    term_title: 'Thanh toán',
    term_content: 'Đặt cọc 50% giá trị đơn hàng; thanh toán nốt 50% giá trị còn lại trước khi giao hàng.',
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
    term_title: 'Vận chuyển',
    term_content: 'Miễn phí giao hàng đến chân công trình vào thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội.',
    display_order: 4,
    is_visible: true,
  },
  {
    id: 'term-5',
    term_title: 'Tiến độ giao hàng',
    term_content: 'Lần 1: giao phần hàng có sẵn sau 5–7 ngày từ ngày nhận tạm ứng.\nLần 2: giao phần còn lại sau 120–150 ngày kể từ ngày nhận tạm ứng.',
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

// Helper to get formatted document code (DH-... for order confirmation / WON, BG-... for quotation)
export function getDocumentDisplayCode(quotation: SaleQuotation, docTitle = 'XÁC NHẬN ĐƠN HÀNG'): string {
  const isOrder = docTitle === 'XÁC NHẬN ĐƠN HÀNG' || docTitle === 'ĐƠN ĐẶT HÀNG' || quotation.status === 'WON';
  if (isOrder) {
    return quotation.quotation_code.replace(/^BG-/, 'DH-');
  }
  return quotation.quotation_code;
}

// Helper to get intro text based on document type
export function getDocumentIntroText(docTitle = 'XÁC NHẬN ĐƠN HÀNG'): string {
  if (docTitle === 'BÁO GIÁ') {
    return '“Thay mặt Công ty, xin hân hạnh gửi đến quý khách báo giá gồm các hạng mục như sau:”';
  }
  if (docTitle === 'ĐƠN ĐẶT HÀNG') {
    return '“Thay mặt Công ty, xin hân hạnh gửi đến quý khách đơn đặt hàng với các hạng mục như sau:”';
  }
  return '“Thay mặt Công ty, xin hân hạnh xác nhận đơn hàng của Quý khách với các hạng mục như sau:”';
}

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
  docTitle = 'XAC_NHAN_DON_HANG'
): string {
  const customerPart = customer
    ? sanitizeFileName(customer.customer_name || customer.company_name || '')
    : 'Khach_hang';
  const displayCode = getDocumentDisplayCode(quotation, docTitle);
  const codePart = sanitizeFileName(displayCode);
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
  const displayCode = getDocumentDisplayCode(quotation, docTitle);
  const isOrder = docTitle !== 'BÁO GIÁ';
  const codeLabel = isOrder ? 'Số ĐH:' : 'Số BG:';
  const introText = getDocumentIntroText(docTitle);

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
    ['', '', '', '', '', '', '', codeLabel, displayCode],
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
    [introText],
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
    ['CÁC ĐIỀU KHOẢN KÈM THEO'],
    ...visibleTerms.map((term, idx) => [
      `${idx + 1}. ${term.term_title}`,
      term.term_content,
    ]),
    ...(quotation.note ? [['Ghi chú bổ sung', quotation.note]] : []),
    [''],
    ['', '', '', '', '', '', '', 'Chân thành cám ơn Quý khách!'],
    [''],
    [''],
    ['ĐẠI DIỆN KHÁCH HÀNG', '', '', '', '', '', 'ĐẠI DIỆN BÁN HÀNG'],
    ['(Ký, ghi rõ họ tên)', '', '', '', '', '', '(Ký, ghi rõ họ tên)'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã sản phẩm
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

  const displayCode = getDocumentDisplayCode(quotation, docTitle);
  const isOrder = docTitle !== 'BÁO GIÁ';
  const codeLabel = isOrder ? 'Số ĐH:' : 'Số BG:';
  const introText = getDocumentIntroText(docTitle);

  const saleFullName = typeof saleUser === 'object' ? saleUser?.full_name : saleUser || COMPANY_INFO.defaultSaleName;
  const salePhone = typeof saleUser === 'object' ? saleUser?.phone || COMPANY_INFO.defaultSalePhone : COMPANY_INFO.defaultSalePhone;
  const saleEmail = typeof saleUser === 'object' ? saleUser?.email || COMPANY_INFO.defaultSaleEmail : COMPANY_INFO.defaultSaleEmail;

  const termsToUse = customTerms || quotation.terms || DEFAULT_QUOTATION_TERMS;
  const visibleTerms = termsToUse.filter((t) => t.is_visible && t.term_content?.trim());

  const tableRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
        <td style="text-align: center; vertical-align: middle; padding: 2px;">
          ${
            item.image_url
              ? `<img src="${item.image_url}" alt="" style="max-width: 46px; max-height: 46px; object-fit: contain; border-radius: 2px; display: inline-block; vertical-align: middle;" onerror="this.style.display='none'" />`
              : ''
          }
        </td>
        <td style="font-weight: 600; color: #1e3a8a; vertical-align: middle;">${item.product_code}</td>
        <td style="font-weight: 500; vertical-align: middle;">${item.product_name}</td>
        <td style="color: #334155; font-weight: 500; vertical-align: middle;">${item.brand || ''}</td>
        <td style="text-align: center; vertical-align: middle;">${item.unit}</td>
        <td style="text-align: right; font-weight: 600; vertical-align: middle;">${formatNumber(item.quantity)}</td>
        <td style="text-align: right; font-weight: 600; vertical-align: middle;">${formatVND(item.sale_price)}</td>
        <td style="text-align: right; font-weight: 700; color: #0f766e; vertical-align: middle;">${formatVND(item.amount)}</td>
        <td style="color: #64748b; font-size: 11px; vertical-align: middle;">${item.note || ''}</td>
      </tr>
    `
    )
    .join('');

  const termsRowsHTML = visibleTerms
    .map(
      (term, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 3.5px 6px; width: 145px; vertical-align: top; font-weight: 700; color: #0f172a; white-space: nowrap; font-size: 11.5px;">
          ${idx + 1}. ${term.term_title}
        </td>
        <td style="padding: 3.5px 6px; vertical-align: top; color: #334155; font-size: 11.5px; line-height: 1.35; white-space: pre-line;">
          ${term.term_content}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${docTitle} ${displayCode} - ${customerName}</title>
      <style>
        @page {
          size: A4;
          margin: 8mm 12mm;
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
          font-size: 12px;
          line-height: 1.35;
          padding: 12px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .order-meta {
          text-align: right;
        }
        .order-number {
          font-size: 12.5px;
          font-weight: 700;
          color: #0f766e;
        }
        .order-date {
          font-size: 11.5px;
          color: #475569;
          margin-top: 1px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 8px;
          background: #ffffff;
          padding: 6px 4px;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-col {
          padding-right: 8px;
        }
        .info-col:first-child {
          border-right: 1px solid #e2e8f0;
        }
        .info-col h4 {
          font-size: 11px;
          color: #0f766e;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }
        .info-row {
          display: flex;
          margin-bottom: 2px;
          font-size: 11.5px;
          line-height: 1.38;
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
          margin-top: 8px;
          margin-bottom: 8px;
          font-style: italic;
          color: #334155;
          font-size: 12px;
          padding-left: 2px;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        table.items-table th {
          background: #0f766e;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 4px;
          border: 1px solid #0f766e;
        }
        table.items-table td {
          padding: 4px 4px;
          border: 1px solid #cbd5e1;
          font-size: 11.5px;
        }
        table.items-table tr:nth-child(even) {
          background-color: #fafbfc;
        }
        .total-box {
          display: flex;
          justify-content: flex-end;
          margin-top: 4px;
          margin-bottom: 8px;
        }
        .total-card {
          width: 320px;
          background: #f0fdf4;
          border: 1px solid #10b981;
          border-radius: 3px;
          padding: 5px 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #065f46;
        }
        .terms-block {
          margin-top: 6px;
          margin-bottom: 8px;
          padding: 5px 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #0f766e;
          border-radius: 3px;
          page-break-inside: avoid;
        }
        .terms-header {
          font-size: 11px;
          font-weight: 800;
          color: #0f766e;
          text-transform: uppercase;
          margin-bottom: 3px;
          padding-bottom: 2px;
          border-bottom: 1px solid #e2e8f0;
        }
        .terms-table {
          width: 100%;
          border-collapse: collapse;
        }
        .thank-you {
          text-align: right;
          font-style: italic;
          font-weight: 700;
          color: #0f766e;
          font-size: 12px;
          margin-top: 4px;
          margin-bottom: 12px;
          padding-right: 6px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding: 0 35px;
          page-break-inside: avoid;
        }
        .sig-block {
          text-align: center;
          width: 190px;
        }
        .sig-title {
          font-weight: 700;
          font-size: 11.5px;
          text-transform: uppercase;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 1px;
        }
        .sig-space {
          height: 45px;
        }
        .sig-name {
          font-weight: 600;
          font-size: 11.5px;
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
          <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">
            HỆ THỐNG QUẢN LÝ BÁN HÀNG HHG
          </div>
        </div>
        <div class="order-meta">
          <div class="order-number">${codeLabel} <span style="color: #0f172a;">${displayCode}</span></div>
          <div class="order-date">Ngày: <strong style="color: #0f172a;">${formatDate(quotation.quotation_date)}</strong></div>
        </div>
      </div>

      <!-- 2. Khu vực 2 cột song song: Thông tin khách hàng | Thông tin công ty (Clean document look) -->
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
          <div style="font-size: 11.5px; line-height: 1.38;">
            <div style="font-weight: 800; color: #0f766e;">${COMPANY_INFO.name}</div>
            <div><span class="info-label">ĐỊA CHỈ:</span> ${COMPANY_INFO.address}</div>
            <div><span class="info-label">Hotline:</span> ${COMPANY_INFO.hotline} | <span class="info-label">WEBSITE:</span> ${COMPANY_INFO.website}</div>
            <div><span class="info-label">Email:</span> ${COMPANY_INFO.email}</div>
            <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #cbd5e1;">
              <span class="info-label">PHỤ TRÁCH:</span> <strong>${saleFullName}</strong> - Mobile: <strong>${salePhone}</strong>
              <div><span class="info-label">Email:</span> ${saleEmail}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Lời dẫn trước bảng sản phẩm -->
      <div class="intro-text">
        ${introText}
      </div>

      <!-- 4. Bảng sản phẩm: STT | ẢNH | MÃ SP | TÊN SẢN PHẨM | HÃNG | ĐVT | SL | ĐƠN GIÁ | THÀNH TIỀN | GHI CHÚ -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 28px;">STT</th>
            <th style="width: 50px;">Ảnh</th>
            <th style="width: 78px;">Mã SP</th>
            <th>Tên sản phẩm</th>
            <th style="width: 68px;">Hãng</th>
            <th style="width: 40px; text-align: center;">ĐVT</th>
            <th style="width: 38px; text-align: right;">SL</th>
            <th style="width: 88px; text-align: right;">Đơn giá</th>
            <th style="width: 98px; text-align: right;">Thành tiền</th>
            <th style="width: 95px;">Ghi chú</th>
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
          <div style="font-size: 10px; color: #065f46; margin-top: 1px; text-align: right;">
            (Giá đã bao gồm thuế GTGT)
          </div>
        </div>
      </div>

      <!-- 6. CÁC ĐIỀU KHOẢN KÈM THEO (BỐ CỤC 2 CỘT COMPACT) -->
      <div class="terms-block">
        <div class="terms-header">CÁC ĐIỀU KHOẢN KÈM THEO</div>
        <table class="terms-table">
          <tbody>
            ${termsRowsHTML}
            ${quotation.note ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 3.5px 6px; width: 145px; vertical-align: top; font-weight: 700; color: #0f172a; white-space: nowrap; font-size: 11.5px;">
                  Ghi chú bổ sung
                </td>
                <td style="padding: 3.5px 6px; vertical-align: top; color: #334155; font-size: 11.5px; line-height: 1.35; white-space: pre-line;">
                  ${quotation.note}
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
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
