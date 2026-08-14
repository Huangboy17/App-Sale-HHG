// ============================================================
// Excel Import Utilities for Products & Inventory
// ============================================================

import * as XLSX from 'xlsx';
import { db, KEYS } from './database';
import type { Product } from './types';

// --- Types ---

export interface ColumnMapping {
  product_code: string | null;
  product_name: string | null;
  product_group: string | null;
  unit: string | null;
  base_price: string | null;
  dp_price: string | null;
  brand: string | null;
  max_discount_rate: string | null;
  vat_rate: string | null;
  stock_quantity: string | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
  warnings: string[];
}

export interface ParsedExcel {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
}

// --- Column name aliases for auto-detection ---

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  product_code: [
    'mã sp', 'mã sản phẩm', 'ma sp', 'ma san pham', 'mã hàng', 'ma hang',
    'mã', 'product_code', 'product code', 'code', 'sku', 'mã hh', 'ma hh',
    'mã hàng hóa', 'item code', 'item_code',
  ],
  product_name: [
    'tên sp', 'tên sản phẩm', 'ten sp', 'ten san pham', 'tên hàng', 'ten hang',
    'product_name', 'product name', 'tên', 'tên hh', 'tên hàng hóa',
    'diễn giải', 'mô tả', 'description', 'name',
  ],
  product_group: [
    'nhóm', 'nhóm sp', 'nhóm sản phẩm', 'nhom', 'nhom sp', 'nhóm hàng',
    'product_group', 'product group', 'category', 'loại', 'phân loại',
    'group', 'nhóm hh',
  ],
  unit: [
    'đvt', 'đơn vị tính', 'dvt', 'don vi tinh', 'đơn vị', 'unit',
    'uom', 'đ.v.t',
  ],
  base_price: [
    'giá ny sau vat', 'giá ny', 'gia ny sau vat', 'gia ny', 'giá niêm yết',
    'gia niem yet', 'giá bán', 'gia ban', 'giá gốc', 'gia goc', 'giá', 'gia',
    'đơn giá', 'don gia', 'base_price', 'base price', 'price', 'unit price',
    'giá list', 'list price',
  ],
  dp_price: [
    'giá dp', 'gia dp', 'giá sàn', 'gia san', 'dp_price', 'dp price',
    'giá tối thiểu', 'gia toi thieu',
  ],
  brand: [
    'hãng', 'hang', 'thương hiệu', 'thuong hieu', 'brand', 'nhà sản xuất',
    'manufacturer', 'nsx', 'hãng sx',
  ],
  max_discount_rate: [
    'ck tối đa', 'ck', 'chiết khấu', 'chiet khau', 'discount', 'max_discount_rate',
    'hệ số ck', 'tỷ lệ ck', 'discount rate', '% ck', '%ck',
  ],
  vat_rate: [
    'vat', 'thuế', 'thue', 'thuế suất', 'vat_rate', 'vat rate', '% vat',
    'thuế gtgt', 'gtgt',
  ],
  stock_quantity: [
    'tồn kho', 'ton kho', 'tồn', 'ton', 'số lượng tồn', 'sl tồn', 'sl ton',
    'stock', 'stock_quantity', 'stock quantity', 'quantity', 'số lượng',
    'sl', 'inventory', 'qty', 'tồn cuối', 'ton cuoi',
  ],
};

// --- Parse Excel File ---

export async function parseExcelFile(file: File): Promise<ParsedExcel> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read as array of arrays, forcing all values to strings to preserve leading zeros
  const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (rawData.length < 2) {
    return { headers: [], rows: [], fileName: file.name };
  }

  // Find the first non-empty row as headers
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    const nonEmpty = rawData[i].filter(cell => String(cell).trim() !== '').length;
    if (nonEmpty >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rawData[headerRowIdx].map(h => String(h).trim());
  const rows: Record<string, string>[] = [];

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    // Skip completely empty rows
    if (!row || row.every(cell => String(cell).trim() === '')) continue;

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = String(row[idx] || '').trim();
    });
    rows.push(obj);
  }

  return { headers, rows, fileName: file.name };
}

// --- Auto-Detect Column Mapping ---

export function autoDetectColumns(
  headers: string[],
  type: 'price' | 'inventory'
): ColumnMapping {
  const mapping: ColumnMapping = {
    product_code: null,
    product_name: null,
    product_group: null,
    unit: null,
    base_price: null,
    dp_price: null,
    brand: null,
    max_discount_rate: null,
    vat_rate: null,
    stock_quantity: null,
  };

  const relevantKeys: (keyof ColumnMapping)[] =
    type === 'price'
      ? ['product_code', 'product_name', 'brand', 'product_group', 'unit', 'base_price', 'dp_price', 'max_discount_rate', 'vat_rate']
      : ['product_code', 'stock_quantity'];

  for (const key of relevantKeys) {
    const aliases = COLUMN_ALIASES[key];
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      if (aliases.some(alias => normalizedHeader === alias || normalizedHeader.includes(alias))) {
        mapping[key] = header;
        break;
      }
    }
  }

  return mapping;
}

// --- Normalize Product Code ---

function normalizeProductCode(raw: string): string {
  // Trim whitespace but preserve leading zeros and all other characters
  return String(raw).trim();
}

// --- Parse Number from Vietnamese format ---

function parseNumber(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  // Remove Vietnamese thousand separators (dots) and replace comma with dot for decimals
  // "1.200.000" -> "1200000", "0,08" -> "0.08"
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// --- Parse Percentage ---

function parsePercentage(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const cleaned = raw.replace('%', '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  // If value is > 1, assume it's a percentage (e.g., 15 = 15% = 0.15)
  return num > 1 ? num / 100 : num;
}

// --- Import Price List ---

export function importPriceList(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ImportResult {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: rows.length,
    errors: [],
    warnings: [],
  };

  if (!mapping.product_code) {
    result.errors.push('Không tìm thấy cột "Mã sản phẩm" trong file. Vui lòng kiểm tra lại.');
    return result;
  }

  const allProducts = db.getProducts();
  const productMap = new Map<string, Product>();
  allProducts.forEach(p => productMap.set(p.product_code, p));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawCode = row[mapping.product_code!];
    const code = normalizeProductCode(rawCode);

    if (!code) {
      result.skipped++;
      result.warnings.push(`Dòng ${i + 2}: Mã sản phẩm trống, bỏ qua.`);
      continue;
    }

    const existing = productMap.get(code);

    // Build update data from mapped columns
    const updateData: Partial<Product> = {};

    if (mapping.product_name && row[mapping.product_name]) {
      updateData.product_name = row[mapping.product_name];
    }
    if (mapping.product_group && row[mapping.product_group]) {
      updateData.product_group = row[mapping.product_group];
    }
    if (mapping.unit && row[mapping.unit]) {
      updateData.unit = row[mapping.unit];
    }
    if (mapping.base_price && row[mapping.base_price]) {
      updateData.base_price = parseNumber(row[mapping.base_price]);
    }
    if (mapping.dp_price && row[mapping.dp_price]) {
      updateData.dp_price = parseNumber(row[mapping.dp_price]);
    }
    if (mapping.brand && row[mapping.brand]) {
      updateData.brand = row[mapping.brand];
    }
    if (mapping.max_discount_rate && row[mapping.max_discount_rate]) {
      updateData.max_discount_rate = parsePercentage(row[mapping.max_discount_rate]);
    }
    if (mapping.vat_rate && row[mapping.vat_rate]) {
      updateData.vat_rate = parsePercentage(row[mapping.vat_rate]);
    }

    // Rule 7 Check: Giá DP <= Giá NY sau VAT
    const finalBasePrice = updateData.base_price !== undefined ? updateData.base_price : (existing?.base_price || 0);
    const finalDpPrice = updateData.dp_price !== undefined ? updateData.dp_price : (existing?.dp_price !== undefined ? existing.dp_price : finalBasePrice);

    if (finalDpPrice > finalBasePrice && finalBasePrice > 0) {
      result.warnings.push(
        `Dòng ${i + 2} (${code}): Giá DP (${finalDpPrice.toLocaleString('vi-VN')} ₫) lớn hơn Giá NY sau VAT (${finalBasePrice.toLocaleString('vi-VN')} ₫) - Dữ liệu không hợp lệ!`
      );
    }

    try {
      if (existing) {
        // Update existing product — DO NOT touch stock_quantity
        db.updateProduct(existing.id, updateData);
        result.updated++;
      } else {
        // Create new product with stock_quantity = 0
        db.createProduct({
          product_code: code,
          product_name: updateData.product_name || code,
          product_group: updateData.product_group || '',
          unit: updateData.unit || 'Cái',
          base_price: updateData.base_price || 0,
          dp_price: finalDpPrice,
          brand: updateData.brand || '',
          max_discount_rate: updateData.max_discount_rate || 0,
          vat_rate: updateData.vat_rate ?? 0.08,
          stock_quantity: 0,
          reserved_quantity: 0,
          status: 'ACTIVE',
        });
        result.created++;
      }
    } catch (error: any) {
      result.errors.push(`Dòng ${i + 2} (${code}): ${error.message || 'Lỗi không xác định'}`);
    }
  }

  return result;
}

// --- Import Inventory ---

export function importInventory(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ImportResult {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: rows.length,
    errors: [],
    warnings: [],
  };

  if (!mapping.product_code) {
    result.errors.push('Không tìm thấy cột "Mã sản phẩm" trong file.');
    return result;
  }
  if (!mapping.stock_quantity) {
    result.errors.push('Không tìm thấy cột "Tồn kho / Số lượng" trong file.');
    return result;
  }

  const allProducts = db.getProducts();
  const productMap = new Map<string, Product>();
  allProducts.forEach(p => productMap.set(p.product_code, p));

  const unmatchedCodes: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawCode = row[mapping.product_code!];
    const code = normalizeProductCode(rawCode);

    if (!code) {
      result.skipped++;
      continue;
    }

    const existing = productMap.get(code);

    if (!existing) {
      unmatchedCodes.push(code);
      result.skipped++;
      continue;
    }

    const quantity = parseNumber(row[mapping.stock_quantity!]);

    try {
      // ONLY update stock_quantity — do NOT touch name, price, group, unit, etc.
      db.updateProduct(existing.id, {
        stock_quantity: quantity,
      } as Partial<Product>);
      result.updated++;
    } catch (error: any) {
      result.errors.push(`Dòng ${i + 2} (${code}): ${error.message || 'Lỗi không xác định'}`);
    }
  }

  if (unmatchedCodes.length > 0) {
    result.warnings.push(
      `Có ${unmatchedCodes.length} mã sản phẩm trong file tồn kho chưa tồn tại trong danh mục sản phẩm:\n${unmatchedCodes.join(', ')}`
    );
  }

  return result;
}

// --- Export Excel Template ---

export function downloadExcelTemplate(type: 'price' | 'inventory'): void {
  const wb = XLSX.utils.book_new();

  if (type === 'price') {
    const data = [
      ['Mã sản phẩm', 'Tên sản phẩm', 'Hãng', 'Nhóm sản phẩm', 'Đơn vị tính', 'Giá NY sau VAT', 'Giá DP'],
      ['SP001', 'Chậu lavabo đặt bàn TOTO', 'TOTO', 'Lavabo', 'Cái', 1000000, 850000],
      ['00125', 'Bồn cầu một khối INAX', 'INAX', 'Bồn cầu', 'Bộ', 2500000, 2100000],
      ['SP003', 'Vòi sen tắm đứng Grohe', 'Grohe', 'Sen vòi', 'Bộ', 2800000, 2400000],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Bảng giá mẫu');
    XLSX.writeFile(wb, 'Mau_Import_Bang_Gia.xlsx');
  } else {
    const data = [
      ['Mã sản phẩm', 'Số lượng tồn kho'],
      ['SP001', 50],
      ['00125', 12],
      ['SP003', 0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Tồn kho mẫu');
    XLSX.writeFile(wb, 'Mau_Import_Ton_Kho.xlsx');
  }
}

