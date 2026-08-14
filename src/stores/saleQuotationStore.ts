import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SaleQuotation, SaleQuotationItem, SaleQuotationStatus, Product } from '../lib/types';
import { db } from '../lib/database';

interface SaleQuotationState {
  quotations: SaleQuotation[];
  loading: boolean;
  loadByCustomer: (customerId: string) => void;
  createQuotation: (
    customerId: string,
    items: Array<{
      product: Product;
      quantity: number;
      sale_price: number;
    }>,
    note?: string
  ) => SaleQuotation;
  updateQuotationStatus: (id: string, status: SaleQuotationStatus) => void;
  getQuotationItems: (quotationId: string) => SaleQuotationItem[];
}

export const useSaleQuotationStore = create<SaleQuotationState>((set, get) => ({
  quotations: [],
  loading: false,

  loadByCustomer: (customerId: string) => {
    set({ loading: true });
    try {
      const quotations = db.getSaleQuotationsByCustomer(customerId);
      set({ quotations, loading: false });
    } catch (error) {
      console.error('Failed to load sale quotations', error);
      set({ loading: false });
    }
  },

  createQuotation: (customerId, items, note) => {
    const code = db.generateSaleQuotationCode();
    const now = new Date().toISOString();

    // Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.sale_price,
      0
    );

    // Create the quotation
    const quotation = db.createSaleQuotation({
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
      // Snapshot
      product_code: item.product.product_code,
      product_name: item.product.product_name,
      brand: item.product.brand,
      unit: item.product.unit,
      listed_price: item.product.base_price,
      dp_price: item.product.dp_price,
      // Sale input
      quantity: item.quantity,
      sale_price: item.sale_price,
      amount: item.quantity * item.sale_price,
    }));

    db.setSaleQuotationItems(quotation.id, quotationItems);

    // Refresh the list
    get().loadByCustomer(customerId);

    return quotation;
  },

  updateQuotationStatus: (id, status) => {
    db.updateSaleQuotation(id, { status });
    // Refresh: find which customer this quotation belongs to
    const allQuotations = db.getSaleQuotations();
    const quotation = allQuotations.find((q) => q.id === id);
    if (quotation) {
      get().loadByCustomer(quotation.customer_id);
    }
  },

  getQuotationItems: (quotationId: string) => {
    return db.getSaleQuotationItems(quotationId);
  },
}));
