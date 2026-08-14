import React, { useState, useRef, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Info, Download } from 'lucide-react';
import { parseExcelFile, autoDetectColumns, downloadExcelTemplate } from '../../lib/excelImport';
import type { ParsedExcel, ColumnMapping, ImportResult } from '../../lib/excelImport';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'price' | 'inventory';
  onImport: (file: File) => Promise<ImportResult>;
}

type Step = 'upload' | 'preview' | 'result';

export default function ImportExcelModal({ isOpen, onClose, type, onImport }: ImportExcelModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedExcel | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = type === 'price' ? 'Import Bảng giá' : 'Import Tồn kho';

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsed(null);
    setMapping(null);
    setResult(null);
    setLoading(false);
    setError(null);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const ext = selectedFile.name.toLowerCase();
    if (!validTypes.includes(selectedFile.type) && !ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
      setError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const parsedData = await parseExcelFile(selectedFile);
      if (parsedData.rows.length === 0) {
        setError('File không có dữ liệu hoặc định dạng không đúng.');
        setLoading(false);
        return;
      }
      setParsed(parsedData);
      const autoMapping = autoDetectColumns(parsedData.headers, type);
      setMapping(autoMapping);
      setStep('preview');
    } catch (err: any) {
      setError('Lỗi đọc file: ' + (err.message || 'Không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const importResult = await onImport(file);
      setResult(importResult);
      setStep('result');
    } catch (err: any) {
      setError('Lỗi import: ' + (err.message || 'Không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const requiredColumns = type === 'price'
    ? [
        { key: 'product_code' as keyof ColumnMapping, label: 'Mã sản phẩm', required: true },
        { key: 'product_name' as keyof ColumnMapping, label: 'Tên sản phẩm', required: false },
        { key: 'brand' as keyof ColumnMapping, label: 'Hãng', required: false },
        { key: 'product_group' as keyof ColumnMapping, label: 'Nhóm SP', required: false },
        { key: 'unit' as keyof ColumnMapping, label: 'ĐVT', required: false },
        { key: 'base_price' as keyof ColumnMapping, label: 'Giá NY sau VAT', required: false },
        { key: 'dp_price' as keyof ColumnMapping, label: 'Giá DP', required: false },
      ]
    : [
        { key: 'product_code' as keyof ColumnMapping, label: 'Mã sản phẩm', required: true },
        { key: 'stock_quantity' as keyof ColumnMapping, label: 'Tồn kho', required: true },
      ];

  const canImport = mapping?.product_code != null && (
    type === 'price' || mapping?.stock_quantity != null
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <div style={{ minHeight: '300px' }}>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>
            <div
              style={{
                width: '100%',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'var(--bg-surface-light)',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border-color)';
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  const fakeEvent = { target: { files: [droppedFile] } } as any;
                  handleFileSelect(fakeEvent);
                }
              }}
            >
              <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Kéo thả file Excel vào đây
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                hoặc <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>chọn file từ máy tính</span>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Hỗ trợ: .xlsx, .xls, .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {loading && (
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" /> Đang đọc file...
              </div>
            )}

            {error && (
              <div style={{
                width: '100%', padding: '0.75rem 1rem', background: 'var(--danger-light)',
                borderRadius: 'var(--radius-md)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
              }}>
                <XCircle size={18} /> {error}
              </div>
            )}

            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--bg-surface-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--primary)' }} />
                <span>Chưa có file mẫu chuẩn?</span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
                onClick={() => downloadExcelTemplate(type)}
              >
                <Download size={14} />
                <span>Tải file Excel mẫu ({type === 'price' ? 'Bảng giá' : 'Tồn kho'})</span>
              </button>
            </div>

            <div style={{
              width: '100%', padding: '0.75rem 1rem', background: 'rgba(22, 119, 255, 0.08)',
              borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {type === 'price' ? (
                  <span>File bảng giá cần có cột <strong>Mã sản phẩm</strong>. Các cột khác (Tên, Hãng, Nhóm, ĐVT, Giá NY sau VAT, Giá DP...) sẽ được tự động nhận diện. <strong>Tồn kho sẽ không bị thay đổi.</strong></span>
                ) : (
                  <span>File tồn kho cần có cột <strong>Mã sản phẩm</strong> và <strong>Số lượng tồn</strong>. <strong>Thông tin sản phẩm (tên, giá, nhóm...) sẽ không bị thay đổi.</strong></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && parsed && mapping && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* File info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-surface-light)', borderRadius: 'var(--radius-md)' }}>
              <FileSpreadsheet size={20} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{parsed.fileName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{parsed.rows.length} dòng dữ liệu</div>
              </div>
            </div>

            {/* Column mapping */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Nhận diện cột</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {requiredColumns.map(col => {
                  const mapped = mapping[col.key];
                  return (
                    <div
                      key={col.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: mapped ? 'var(--success-light)' : (col.required ? 'var(--danger-light)' : 'var(--bg-surface-light)'),
                        borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                      }}
                    >
                      {mapped ? (
                        <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      ) : col.required ? (
                        <XCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                      ) : (
                        <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: 500 }}>{col.label}:</span>
                      <span style={{ color: mapped ? 'var(--success)' : 'var(--text-muted)' }}>
                        {mapped || (col.required ? 'Chưa tìm thấy!' : 'Bỏ qua')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview table */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Xem trước (5 dòng đầu)</h4>
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      {parsed.headers.slice(0, 8).map((h, i) => (
                        <th key={i} style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.75rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {parsed.headers.slice(0, 8).map((h, cIdx) => (
                          <td key={cIdx} style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.75rem' }}>
                            {row[h] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!canImport && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--danger-light)',
                borderRadius: 'var(--radius-md)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
              }}>
                <XCircle size={18} />
                Không tìm được cột bắt buộc. Vui lòng kiểm tra file Excel.
              </div>
            )}

            {error && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--danger-light)',
                borderRadius: 'var(--radius-md)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
              }}>
                <XCircle size={18} /> {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button className="btn btn-outline" onClick={reset}>
                Chọn file khác
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!canImport || loading}
              >
                {loading ? 'Đang import...' : 'Xác nhận Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              {result.errors.length === 0 ? (
                <CheckCircle size={48} style={{ color: 'var(--success)' }} />
              ) : (
                <AlertTriangle size={48} style={{ color: 'var(--warning)' }} />
              )}
              <h3 style={{ marginTop: '0.75rem', fontSize: '1.1rem' }}>
                {result.errors.length === 0 ? 'Import thành công!' : 'Import hoàn tất (có lỗi)'}
              </h3>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {type === 'price' && (
                <div style={{
                  padding: '1rem', textAlign: 'center', background: 'var(--success-light)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{result.created}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tạo mới</div>
                </div>
              )}
              <div style={{
                padding: '1rem', textAlign: 'center', background: 'rgba(22, 119, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{result.updated}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cập nhật</div>
              </div>
              <div style={{
                padding: '1rem', textAlign: 'center', background: 'var(--bg-surface-light)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>{result.skipped}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bỏ qua</div>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--warning-light)',
                borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--warning)', fontWeight: 600 }}>
                  <AlertTriangle size={16} /> Cảnh báo
                </div>
                {result.warnings.map((w, i) => (
                  <p key={i} style={{ color: 'var(--text-main)', margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>{w}</p>
                ))}
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--danger-light)',
                borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
                maxHeight: '150px', overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--danger)', fontWeight: 600 }}>
                  <XCircle size={16} /> Lỗi
                </div>
                {result.errors.map((err, i) => (
                  <p key={i} style={{ color: 'var(--text-main)', margin: '0.25rem 0' }}>{err}</p>
                ))}
              </div>
            )}

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleClose}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
