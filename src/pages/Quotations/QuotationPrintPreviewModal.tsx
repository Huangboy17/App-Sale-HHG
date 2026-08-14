import { useState, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Printer, Download } from 'lucide-react';
import type { SaleQuotation, SaleQuotationItem, Customer, User, QuotationTerm } from '../../lib/types';
import { formatDate, formatVND, formatNumber } from '../../lib/formatters';
import {
  exportQuotationExcel,
  COMPANY_INFO,
  DEFAULT_QUOTATION_TERMS,
  getDocumentDisplayCode,
  getDocumentIntroText,
} from '../../lib/quotationExport';

interface QuotationPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: SaleQuotation;
  customer?: Customer;
  items: SaleQuotationItem[];
  saleUser?: User | string;
  customTerms?: QuotationTerm[];
}

export default function QuotationPrintPreviewModal({
  isOpen,
  onClose,
  quotation,
  customer,
  items,
  saleUser,
  customTerms,
}: QuotationPrintPreviewModalProps) {
  const [docTitle, setDocTitle] = useState<'XÁC NHẬN ĐƠN HÀNG' | 'BÁO GIÁ' | 'ĐƠN ĐẶT HÀNG'>('XÁC NHẬN ĐƠN HÀNG');
  const printContentRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    if (!printContentRef.current) return;
    const content = printContentRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docTitle} ${displayCode} - ${customerName}</title>
          <style>
            @page {
              size: A4;
              margin: 8mm 12mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.35; padding: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #0f766e; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 6px 4px; border: 1px solid #0f766e; }
            td { padding: 4px 4px; border: 1px solid #cbd5e1; font-size: 11.5px; }
            tr:nth-child(even) { background-color: #fafbfc; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  };

  const handleExportExcel = () => {
    exportQuotationExcel(quotation, customer, items, saleUser, docTitle, termsToUse);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước Báo giá / Xác nhận đơn hàng"
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loại chứng từ:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.35rem 1.8rem 0.35rem 0.65rem', fontSize: '0.85rem', fontWeight: 600 }}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value as any)}
            >
              <option value="XÁC NHẬN ĐƠN HÀNG">XÁC NHẬN ĐƠN HÀNG</option>
              <option value="BÁO GIÁ">BÁO GIÁ</option>
              <option value="ĐƠN ĐẶT HÀNG">ĐƠN ĐẶT HÀNG</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button className="btn btn-outline" onClick={handleExportExcel} title="Tải file Excel báo giá">
              <Download size={16} />
              Tải Excel (.xlsx)
            </button>
            <button
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}
              onClick={handlePrint}
              title="Mở hộp thoại In / Lưu file PDF"
            >
              <Printer size={16} />
              In / Lưu PDF
            </button>
          </div>
        </div>
      }
    >
      <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '0.5rem' }}>
        {/* Printable Paper Canvas */}
        <div
          ref={printContentRef}
          style={{
            background: '#ffffff',
            color: '#1e293b',
            padding: '24px 30px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
            maxWidth: '860px',
            margin: '0 auto',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: '12px',
            lineHeight: 1.38,
          }}
        >
          {/* 1. Header Top: Tên chứng từ & Số ĐH + Ngày */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f766e',
              paddingBottom: '6px',
              marginBottom: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {docTitle}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                HỆ THỐNG QUẢN LÝ BÁN HÀNG HHG
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f766e' }}>
                {codeLabel} <span style={{ color: '#0f172a' }}>{displayCode}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px' }}>
                Ngày: <strong style={{ color: '#0f172a' }}>{formatDate(quotation.quotation_date)}</strong>
              </div>
            </div>
          </div>

          {/* 2. Khu vực 2 cột song song: Thông tin khách hàng | Thông tin công ty (Clean document look) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '8px',
              background: '#ffffff',
              padding: '6px 4px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {/* Cột trái: Thông tin khách hàng */}
            <div style={{ paddingRight: '8px', borderRight: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '11px', color: '#0f766e', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800, letterSpacing: '0.03em' }}>
                THÔNG TIN KHÁCH HÀNG
              </h4>
              <div style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>KHÁCH HÀNG: </span>
                  <strong style={{ color: '#1e293b' }}>{customerName}{customerCode ? ` - ${customerCode}` : ''}</strong>
                </div>
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>ĐỊA CHỈ/CÔNG TRÌNH: </span>
                  <strong style={{ color: '#1e293b' }}>{address}</strong>
                </div>
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>SỐ ĐIỆN THOẠI: </span>
                  <strong style={{ color: '#1e293b' }}>{phone}</strong>
                </div>
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>NGƯỜI LIÊN HỆ: </span>
                  <strong style={{ color: '#1e293b' }}>{contactPerson}</strong>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin công ty */}
            <div>
              <h4 style={{ fontSize: '11px', color: '#0f766e', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800, letterSpacing: '0.03em' }}>
                THÔNG TIN CÔNG TY
              </h4>
              <div style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 800, color: '#0f766e' }}>{COMPANY_INFO.name}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>ĐỊA CHỈ: </span>{COMPANY_INFO.address}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>Hotline: </span>{COMPANY_INFO.hotline} | <span style={{ color: '#64748b', fontWeight: 600 }}>WEBSITE: </span>{COMPANY_INFO.website}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>Email: </span>{COMPANY_INFO.email}</div>
                <div style={{ marginTop: '2px', paddingTop: '2px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>PHỤ TRÁCH: </span>
                  <strong>{saleFullName}</strong> - Mobile: <strong>{salePhone}</strong>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Email: </span>{saleEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Lời dẫn trước bảng sản phẩm */}
          <div style={{ marginTop: '8px', marginBottom: '8px', fontStyle: 'italic', color: '#334155', fontSize: '12px', paddingLeft: '2px' }}>
            {introText}
          </div>

          {/* 4. Bảng sản phẩm: STT | ẢNH | MÃ SP | TÊN SẢN PHẨM | HÃNG | ĐVT | SL | ĐƠN GIÁ | THÀNH TIỀN | GHI CHÚ */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: '#0f766e', color: '#ffffff' }}>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '28px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>STT</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '50px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Ảnh</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '78px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Mã SP</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Tên sản phẩm</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '68px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Hãng</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '40px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>ĐVT</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '38px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>SL</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '88px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Đơn giá</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '98px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Thành tiền</th>
                <th style={{ padding: '6px 4px', border: '1px solid #0f766e', width: '95px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} style={{ background: idx % 2 === 1 ? '#fafbfc' : '#ffffff' }}>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '11.5px', verticalAlign: 'middle' }}>{idx + 1}</td>
                  <td style={{ padding: '2px 4px', border: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle' }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        style={{ maxWidth: '46px', maxHeight: '46px', objectFit: 'contain', borderRadius: '2px', display: 'inline-block', verticalAlign: 'middle' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                  </td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#1e3a8a', fontSize: '11.5px', verticalAlign: 'middle' }}>{item.product_code}</td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', fontSize: '11.5px', fontWeight: 500, verticalAlign: 'middle' }}>
                    {item.product_name}
                  </td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', fontSize: '11.5px', color: '#334155', fontWeight: 500, verticalAlign: 'middle' }}>
                    {item.brand || ''}
                  </td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '11.5px', verticalAlign: 'middle' }}>{item.unit}</td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, fontSize: '11.5px', verticalAlign: 'middle' }}>{formatNumber(item.quantity)}</td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, fontSize: '11.5px', verticalAlign: 'middle' }}>{formatVND(item.sale_price)}</td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, color: '#0f766e', fontSize: '11.5px', verticalAlign: 'middle' }}>{formatVND(item.amount)}</td>
                  <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', fontSize: '11px', color: '#64748b', verticalAlign: 'middle' }}>{item.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 5. Total box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '8px' }}>
            <div style={{ width: '320px', background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '3px', padding: '5px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
                <span>TỔNG CỘNG THANH TOÁN:</span>
                <span>{formatVND(quotation.total_amount)}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#065f46', marginTop: '1px', textAlign: 'right' }}>
                (Giá đã bao gồm thuế GTGT)
              </div>
            </div>
          </div>

          {/* 6. CÁC ĐIỀU KHOẢN KÈM THEO (BỐ CỤC 2 CỘT COMPACT) */}
          <div
            style={{
              marginTop: '6px',
              marginBottom: '8px',
              padding: '5px 8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '3px solid #0f766e',
              borderRadius: '3px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0f766e',
                textTransform: 'uppercase',
                marginBottom: '3px',
                paddingBottom: '2px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              CÁC ĐIỀU KHOẢN KÈM THEO
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {visibleTerms.map((term, idx) => (
                  <tr key={term.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '3.5px 6px', width: '145px', verticalAlign: 'top', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '11.5px' }}>
                      {idx + 1}. {term.term_title}
                    </td>
                    <td style={{ padding: '3.5px 6px', verticalAlign: 'top', color: '#334155', fontSize: '11.5px', lineHeight: 1.35, whiteSpace: 'pre-line' }}>
                      {term.term_content}
                    </td>
                  </tr>
                ))}
                {quotation.note && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '3.5px 6px', width: '145px', verticalAlign: 'top', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '11.5px' }}>
                      Ghi chú bổ sung
                    </td>
                    <td style={{ padding: '3.5px 6px', verticalAlign: 'top', color: '#334155', fontSize: '11.5px', lineHeight: 1.35, whiteSpace: 'pre-line' }}>
                      {quotation.note}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 7. Lời cảm ơn */}
          <div
            style={{
              textAlign: 'right',
              fontStyle: 'italic',
              fontWeight: 700,
              color: '#0f766e',
              fontSize: '12px',
              marginTop: '4px',
              marginBottom: '12px',
              paddingRight: '6px',
            }}
          >
            Chân thành cám ơn Quý khách!
          </div>

          {/* 8. Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 35px' }}>
            <div style={{ textAlign: 'center', width: '190px' }}>
              <div style={{ fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                ĐẠI DIỆN KHÁCH HÀNG
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ height: '45px' }} />
              <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#1e293b' }}>{customerName}</div>
            </div>
            <div style={{ textAlign: 'center', width: '190px' }}>
              <div style={{ fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                ĐẠI DIỆN BÁN HÀNG
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ height: '45px' }} />
              <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#1e293b' }}>{saleFullName}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
