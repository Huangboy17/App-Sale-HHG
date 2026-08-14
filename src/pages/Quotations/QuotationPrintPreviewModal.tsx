import { useState, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Printer, Download } from 'lucide-react';
import type { SaleQuotation, SaleQuotationItem, Customer, User, QuotationTerm } from '../../lib/types';
import { formatDate, formatVND, formatNumber } from '../../lib/formatters';
import { exportQuotationExcel, COMPANY_INFO, DEFAULT_QUOTATION_TERMS } from '../../lib/quotationExport';

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
          <title>${docTitle} ${quotation.quotation_code} - ${customerName}</title>
          <style>
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.45; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th { background: #0f766e; color: #fff; font-size: 11.5px; font-weight: 700; text-transform: uppercase; padding: 8px 6px; border: 1px solid #0f766e; }
            td { padding: 7px 6px; border: 1px solid #cbd5e1; font-size: 12px; }
            tr:nth-child(even) { background-color: #f8fafc; }
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
            padding: '32px 36px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '860px',
            margin: '0 auto',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: '13px',
            lineHeight: 1.45,
          }}
        >
          {/* 1. Header Top: Tên chứng từ & Số ĐH + Ngày */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2.5px solid #0f766e',
              paddingBottom: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {docTitle}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                HỆ THỐNG QUẢN LÝ BÁN HÀNG HHG
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                Số ĐH: <span style={{ color: '#0f172a' }}>{quotation.quotation_code}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Ngày: <strong style={{ color: '#0f172a' }}>{formatDate(quotation.quotation_date)}</strong>
              </div>
            </div>
          </div>

          {/* 2. Khu vực 2 cột song song: Thông tin khách hàng | Thông tin công ty */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '14px',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Cột trái: Thông tin khách hàng */}
            <div>
              <h4 style={{ fontSize: '12px', color: '#0f766e', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                THÔNG TIN KHÁCH HÀNG
              </h4>
              <div style={{ fontSize: '12px', lineHeight: 1.55 }}>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>KHÁCH HÀNG: </span>
                  <strong style={{ color: '#1e293b' }}>{customerName}{customerCode ? ` - ${customerCode}` : ''}</strong>
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>ĐỊA CHỈ/CÔNG TRÌNH: </span>
                  <strong style={{ color: '#1e293b' }}>{address}</strong>
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>SỐ ĐIỆN THOẠI: </span>
                  <strong style={{ color: '#1e293b' }}>{phone}</strong>
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>NGƯỜI LIÊN HỆ: </span>
                  <strong style={{ color: '#1e293b' }}>{contactPerson}</strong>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin công ty */}
            <div>
              <h4 style={{ fontSize: '12px', color: '#0f766e', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                THÔNG TIN CÔNG TY
              </h4>
              <div style={{ fontSize: '12px', lineHeight: 1.55 }}>
                <div style={{ fontWeight: 800, color: '#0f766e' }}>{COMPANY_INFO.name}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>ĐỊA CHỈ: </span>{COMPANY_INFO.address}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>Hotline: </span>{COMPANY_INFO.hotline} | <span style={{ color: '#64748b', fontWeight: 600 }}>WEBSITE: </span>{COMPANY_INFO.website}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>Email: </span>{COMPANY_INFO.email}</div>
                <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>PHỤ TRÁCH: </span>
                  <strong>{saleFullName}</strong> - Mobile: <strong>{salePhone}</strong>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Email: </span>{saleEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Lời dẫn trước bảng sản phẩm */}
          <div style={{ marginBottom: '12px', fontStyle: 'italic', color: '#334155', fontSize: '12.5px', paddingLeft: '2px' }}>
            “Thay mặt Công ty, xin hân hạnh gửi đến quý khách báo giá gồm các hạng mục như sau:”
          </div>

          {/* 4. Bảng sản phẩm: STT → Mã SP → Tên sản phẩm → Hãng → ĐVT → Số lượng → Đơn giá → Thành tiền → Ghi chú */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ background: '#0f766e', color: '#ffffff' }}>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '32px', textAlign: 'center', fontSize: '11.5px', textTransform: 'uppercase' }}>STT</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '85px', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>Mã SP</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>Tên sản phẩm</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '75px', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>Hãng</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '48px', textAlign: 'center', fontSize: '11.5px', textTransform: 'uppercase' }}>ĐVT</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '45px', textAlign: 'right', fontSize: '11.5px', textTransform: 'uppercase' }}>SL</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '95px', textAlign: 'right', fontSize: '11.5px', textTransform: 'uppercase' }}>Đơn giá</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '105px', textAlign: 'right', fontSize: '11.5px', textTransform: 'uppercase' }}>Thành tiền</th>
                <th style={{ padding: '8px 6px', border: '1px solid #0f766e', width: '110px', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} style={{ background: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '12px' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#1e3a8a', fontSize: '12px' }}>{item.product_code}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 500 }}>
                    {item.product_name}
                  </td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                    {item.brand || ''}
                  </td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '12px' }}>{item.unit}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, fontSize: '12px' }}>{formatNumber(item.quantity)}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, fontSize: '12px' }}>{formatVND(item.sale_price)}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, color: '#0f766e', fontSize: '12px' }}>{formatVND(item.amount)}</td>
                  <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', fontSize: '11.5px', color: '#64748b' }}>{item.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 5. Total box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
            <div style={{ width: '340px', background: '#f0fdf4', border: '1.5px solid #10b981', borderRadius: '6px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#065f46' }}>
                <span>TỔNG CỘNG THANH TOÁN:</span>
                <span>{formatVND(quotation.total_amount)}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#065f46', marginTop: '4px', textAlign: 'right' }}>
                (Giá đã bao gồm thuế GTGT)
              </div>
            </div>
          </div>

          {/* 6. CÁC ĐIỀU KHOẢN KÈM THEO */}
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #0f766e',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#0f766e',
                textTransform: 'uppercase',
                marginBottom: '10px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
              }}
            >
              CÁC ĐIỀU KHOẢN KÈM THEO
            </div>
            {visibleTerms.map((term, idx) => (
              <div key={term.id || idx} style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#0f172a' }}>{idx + 1}. {term.term_title}:</strong>
                <div style={{ whiteSpace: 'pre-line', marginTop: '2px', paddingLeft: '12px', color: '#334155' }}>
                  {term.term_content}
                </div>
              </div>
            ))}
            {quotation.note && (
              <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                <strong>Ghi chú bổ sung:</strong> {quotation.note}
              </div>
            )}
          </div>

          {/* 7. Lời cảm ơn */}
          <div
            style={{
              textAlign: 'right',
              fontStyle: 'italic',
              fontWeight: 700,
              color: '#0f766e',
              fontSize: '13px',
              marginBottom: '24px',
              paddingRight: '10px',
            }}
          >
            Chân thành cám ơn Quý khách!
          </div>

          {/* 8. Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '0 40px' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontWeight: 700, fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                ĐẠI DIỆN KHÁCH HÀNG
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ height: '65px' }} />
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{customerName}</div>
            </div>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontWeight: 700, fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                ĐẠI DIỆN BÁN HÀNG
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ height: '65px' }} />
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{saleFullName}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
