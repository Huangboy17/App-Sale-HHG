import { create } from 'zustand';
import type { Product, ProductStatus } from '../lib/types';
import { db } from '../lib/database';

interface ProductFilters {
  brand?: string;
  group?: string;
  status?: ProductStatus;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  filters: ProductFilters;
  brands: string[];
  groups: string[];
  loadProducts: () => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'dp_price' | 'available_quantity'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  searchQuery: '',
  filters: {},
  brands: [],
  groups: [],
  loadProducts: () => {
    set({ loading: true });
    try {
      const allProducts = db.getProducts();
      const { searchQuery, filters } = get();
      
      let filtered = allProducts;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.product_code.toLowerCase().includes(lowerQuery) || 
          p.product_name.toLowerCase().includes(lowerQuery)
        );
      }
      
      if (filters.brand) filtered = filtered.filter(p => p.brand === filters.brand);
      if (filters.group) filtered = filtered.filter(p => p.product_group === filters.group);
      if (filters.status) filtered = filtered.filter(p => p.status === filters.status);
      
      const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
      const groups = [...new Set(allProducts.map(p => p.product_group).filter(Boolean))];
      
      set({ products: filtered, brands, groups, loading: false });
    } catch (error) {
      console.error('Failed to load products', error);
      set({ loading: false });
    }
  },
  addProduct: (productData) => {
    const newProduct = db.createProduct(productData);
    if (newProduct) {
      get().loadProducts();
    }
  },
  updateProduct: (id, productData) => {
    const updated = db.updateProduct(id, productData);
    if (updated) {
      get().loadProducts();
    }
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadProducts();
  },
  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().loadProducts();
  }
}));
