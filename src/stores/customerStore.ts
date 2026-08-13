import { create } from 'zustand';
import type { Customer } from '../lib/types';
import { db } from '../lib/database';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  loadCustomers: () => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Customer | null;
  updateCustomer: (id: string, customer: Partial<Customer>) => Customer | null;
  setSearchQuery: (query: string) => void;
  checkDuplicate: (name: string, phone?: string, email?: string) => boolean;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  searchQuery: '',
  loadCustomers: () => {
    set({ loading: true });
    try {
      const allCustomers = db.getCustomers();
      const { searchQuery } = get();
      
      let filtered = allCustomers;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
          c.customer_name.toLowerCase().includes(lowerQuery) || 
          (c.phone && c.phone.includes(lowerQuery)) ||
          (c.email && c.email.toLowerCase().includes(lowerQuery))
        );
      }
      
      set({ customers: filtered, loading: false });
    } catch (error) {
      console.error('Failed to load customers', error);
      set({ loading: false });
    }
  },
  addCustomer: (customerData) => {
    const newCustomer = db.createCustomer(customerData);
    if (newCustomer) {
      get().loadCustomers();
    }
    return newCustomer;
  },
  updateCustomer: (id, customerData) => {
    const updated = db.updateCustomer(id, customerData);
    if (updated) {
      get().loadCustomers();
    }
    return updated;
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadCustomers();
  },
  checkDuplicate: (name, phone, email) => {
    const allCustomers = db.getCustomers();
    return allCustomers.some(c => 
      c.customer_name.toLowerCase() === name.toLowerCase() ||
      (phone && c.phone === phone) ||
      (email && c.email?.toLowerCase() === email.toLowerCase())
    );
  }
}));
