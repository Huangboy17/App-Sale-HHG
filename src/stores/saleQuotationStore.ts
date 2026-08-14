// ============================================================
// Sale Quotation Store (Zustand) - Supports Supabase & localStorage
// ============================================================

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  SaleQuotation, SaleQuotationItem, SaleQuotationStatus, Product,
  QuotationDispatchSummary, QuotationDispatchItem, QuotationTerm
} from '../lib/types';
import { db } from '../lib/database';
import { useSupabase } from '../lib/supabaseClient';
import * as supaDb from '../lib/supabaseDatabase';

interface SaleQuotationState {
  quotations: SaleQuotation[];
  loading: boolean;
  loadByCustomer: (customerId: string) => Promise<void>;
  createQuotation: (
    customerId: string,
    items: Array<{
      product: Product;
      quantity: number;
      sale_price: number;
      note?: string;
    }>,
    note?: string,
    terms?: QuotationTerm[]
  ) => Promise<SaleQuotation | null>;
  updateQuotationStatus: (id: string, status: SaleQuotationStatus) => Promise<void>;
  getQuotationItems: (quotationId: string) => Promise<SaleQuotationItem[]>;
  getQuotationDispatch: (quotationId: string) => Promise<QuotationDispatchSummary | null>;
  refreshQuotationDispatch: (quotationId: string) => Promise<QuotationDispatchSummary | null>;
  updateDispatchItemStatus: (quotationId: string, itemId: string, updates: Partial<QuotationDispatchItem>) => Promise<void>;
}

export const useSaleQuotationStore = create<SaleQuotationState>((set, get) => ({
  quotations: [],
  loading: false,

  loadByCustomer: async (customerId: string) => {
    set({ loading: true });
    try {
      if (useSupabase()) {
        const quotations = await supaDb.getSaleQuotationsByCustomer(customerId);
        set({ quotations, loading: false });
      } else {
        const quotations = db.getSaleQuotationsByCustomer(customerId);
        set({ quotations, loading: false });
      }
    } catch (error) {
      console.error('Failed to load sale quotations', error);
      set({ loading: false });
    }
  },

  createQuotation: async (customerId, items, note, terms) => {
    try {
      const now = new Date().toISOString();

      // Calculate total
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.sale_price,
        0
      );

      if (useSupabase()) {
        const code = await supaDb.generateSaleQuotationCode();

        const quotation = await supaDb.createSaleQuotation({
          quotation_code: code,
          customer_id: customerId,
          quotation_date: now,
          status: 'DRAFT',
          total_amount: totalAmount,
          note: note || undefined,
        });

        // Create snapshot items
        const quotationItems: SaleQuotationItem[] = items.map((item) => ({
          id: uuidv4(),
          quotation_id: quotation.id,
          product_id: item.product.id,
          product_code: item.product.product_code,
          product_name: item.product.product_name,
          brand: item.product.brand || '',
          unit: item.product.unit,
          image_url: item.product.image_url || item.product.images?.[0] || undefined,
          listed_price: item.product.base_price,
          dp_price: item.product.dp_price,
          quantity: item.quantity,
          sale_price: item.sale_price,
          note: item.note || undefined,
          amount: item.quantity * item.sale_price,
        }));

        await supaDb.setSaleQuotationItems(quotation.id, quotationItems);

        if (terms && terms.length > 0) {
          await supaDb.setQuotationTerms(quotation.id, terms);
        }

        await get().loadByCustomer(customerId);
        return quotation;
      } else {
        const code = db.generateSaleQuotationCode();

        const quotation = db.createSaleQuotation({
          quotation_code: code,
          customer_id: customerId,
          quotation_date: now,
          status: 'DRAFT',
          total_amount: totalAmount,
          note: note || undefined,
          terms: terms || undefined,
        });

        const quotationItems: SaleQuotationItem[] = items.map((item) => ({
          id: uuidv4(),
          quotation_id: quotation.id,
          product_id: item.product.id,
          product_code: item.product.product_code,
          product_name: item.product.product_name,
          brand: item.product.brand || '',
          unit: item.product.unit,
          image_url: item.product.image_url || item.product.images?.[0] || undefined,
          listed_price: item.product.base_price,
          dp_price: item.product.dp_price,
          quantity: item.quantity,
          sale_price: item.sale_price,
          note: item.note || undefined,
          amount: item.quantity * item.sale_price,
        }));

        db.setSaleQuotationItems(quotation.id, quotationItems);
        get().loadByCustomer(customerId);
        return quotation;
      }
    } catch (err) {
      console.error('Failed to create quotation', err);
      return null;
    }
  },

  updateQuotationStatus: async (id, status) => {
    if (useSupabase()) {
      await supaDb.updateSaleQuotation(id, { status });

      if (status === 'WON') {
        await supaDb.createOrUpdateQuotationDispatch(id, false);
      }

      const allQuotations = await supaDb.getSaleQuotations();
      const quotation = allQuotations.find((q) => q.id === id);
      if (quotation) {
        await get().loadByCustomer(quotation.customer_id);
      }
    } else {
      db.updateSaleQuotation(id, { status });

      if (status === 'WON') {
        db.createOrUpdateQuotationDispatch(id, false);
      }

      const allQuotations = db.getSaleQuotations();
      const quotation = allQuotations.find((q) => q.id === id);
      if (quotation) {
        get().loadByCustomer(quotation.customer_id);
      }
    }
  },

  getQuotationItems: async (quotationId: string) => {
    if (useSupabase()) {
      return await supaDb.getSaleQuotationItems(quotationId);
    }
    return db.getSaleQuotationItems(quotationId);
  },

  getQuotationDispatch: async (quotationId: string) => {
    if (useSupabase()) {
      return await supaDb.getSaleQuotationDispatch(quotationId);
    }
    return db.getSaleQuotationDispatch(quotationId);
  },

  refreshQuotationDispatch: async (quotationId: string) => {
    if (useSupabase()) {
      return await supaDb.createOrUpdateQuotationDispatch(quotationId, true);
    }
    return db.createOrUpdateQuotationDispatch(quotationId, true);
  },

  updateDispatchItemStatus: async (quotationId: string, itemId: string, updates: Partial<QuotationDispatchItem>) => {
    if (useSupabase()) {
      const summary = await supaDb.getSaleQuotationDispatch(quotationId);
      if (!summary) return;
      summary.items = summary.items.map((item) =>
        item.id === itemId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      );
      await supaDb.saveSaleQuotationDispatch(summary);
    } else {
      const summary = db.getSaleQuotationDispatch(quotationId);
      if (!summary) return;
      summary.items = summary.items.map((item) =>
        item.id === itemId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      );
      db.saveSaleQuotationDispatch(summary);
    }
  },
}));
