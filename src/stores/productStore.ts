// ============================================================
// Product Store (Zustand) - Supports Supabase & localStorage
// ============================================================

import { create } from 'zustand';
import type { Product, ProductStatus } from '../lib/types';
import { db } from '../lib/database';
import { useSupabase } from '../lib/supabaseClient';
import * as supaDb from '../lib/supabaseDatabase';
import { parseExcelFile, autoDetectColumns, importPriceList, importInventory } from '../lib/excelImport';
import type { ImportResult } from '../lib/excelImport';

interface ProductFilters {
  brand?: string;
  group?: string;
  status?: ProductStatus;
  stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface ProductState {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  filters: ProductFilters;
  brands: string[];
  groups: string[];
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'dp_price' | 'available_quantity'>) => Promise<Product | null>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product | null>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  importPriceListFile: (file: File) => Promise<ImportResult>;
  importInventoryFile: (file: File) => Promise<ImportResult>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  searchQuery: '',
  filters: {},
  brands: [],
  groups: [],

  loadProducts: async () => {
    set({ loading: true });
    try {
      const allProducts = useSupabase()
        ? await supaDb.getProducts()
        : db.getProducts();

      const { searchQuery, filters } = get();

      let filtered = allProducts;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.product_code.toLowerCase().includes(lowerQuery) ||
            p.product_name.toLowerCase().includes(lowerQuery)
        );
      }

      if (filters.brand) filtered = filtered.filter((p) => p.brand === filters.brand);
      if (filters.group) filtered = filtered.filter((p) => p.product_group === filters.group);
      if (filters.status) filtered = filtered.filter((p) => p.status === filters.status);

      // Stock filter
      if (filters.stockFilter === 'in_stock') {
        filtered = filtered.filter((p) => p.stock_quantity > 10);
      } else if (filters.stockFilter === 'low_stock') {
        filtered = filtered.filter((p) => p.stock_quantity >= 1 && p.stock_quantity <= 10);
      } else if (filters.stockFilter === 'out_of_stock') {
        filtered = filtered.filter((p) => p.stock_quantity === 0);
      }

      const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))];
      const groups = [...new Set(allProducts.map((p) => p.product_group).filter(Boolean))];

      set({ products: filtered, brands, groups, loading: false });
    } catch (error) {
      console.error('Failed to load products', error);
      set({ loading: false });
    }
  },

  addProduct: async (productData) => {
    try {
      let newProduct: Product | null = null;
      if (useSupabase()) {
        newProduct = await supaDb.createProduct(productData);
      } else {
        newProduct = db.createProduct(productData);
      }
      if (newProduct) {
        await get().loadProducts();
      }
      return newProduct;
    } catch (err) {
      console.error('Failed to add product', err);
      return null;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      let updated: Product | null = null;
      if (useSupabase()) {
        updated = await supaDb.updateProduct(id, productData);
      } else {
        updated = db.updateProduct(id, productData);
      }
      if (updated) {
        await get().loadProducts();
      }
      return updated;
    } catch (err) {
      console.error('Failed to update product', err);
      return null;
    }
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadProducts();
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().loadProducts();
  },

  importPriceListFile: async (file: File): Promise<ImportResult> => {
    const parsed = await parseExcelFile(file);
    const mapping = autoDetectColumns(parsed.headers, 'price');
    const result = await importPriceList(parsed.rows, mapping);
    await get().loadProducts();
    return result;
  },

  importInventoryFile: async (file: File): Promise<ImportResult> => {
    const parsed = await parseExcelFile(file);
    const mapping = autoDetectColumns(parsed.headers, 'inventory');
    const result = await importInventory(parsed.rows, mapping);
    await get().loadProducts();
    return result;
  },
}));
