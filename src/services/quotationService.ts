import { db, KEYS } from '../lib/database';
import type { Quotation, QuotationVersion, QuotationItem } from '../lib/types';

export const quotationService = {
  getQuotations: () => db.findAll<Quotation>(KEYS.QUOTATIONS),
  getQuotationById: (id: string) => db.findById<Quotation>(KEYS.QUOTATIONS, id),
  getVersionsByQuotation: (quotationId: string) => db.findAll<QuotationVersion>(KEYS.QUOTATION_VERSIONS).filter(v => v.quotation_id === quotationId),
  getItemsByVersion: (versionId: string) => db.findAll<QuotationItem>(KEYS.QUOTATION_ITEMS).filter(i => i.quotation_version_id === versionId),
  
  createQuotation: (data: Omit<Quotation, 'id' | 'quotation_code' | 'created_at' | 'updated_at'>) => {
    return db.create(KEYS.QUOTATIONS, {
      ...data,
      quotation_code: db.getNextCode('QT')
    });
  },
  createVersion: (data: Omit<QuotationVersion, 'id' | 'created_at' | 'updated_at'>) => db.create(KEYS.QUOTATION_VERSIONS, data),
  createItem: (data: Omit<QuotationItem, 'id' | 'created_at'>) => db.create(KEYS.QUOTATION_ITEMS, data as any),
  
  updateVersion: (id: string, data: Partial<QuotationVersion>) => db.update(KEYS.QUOTATION_VERSIONS, id, data)
};
