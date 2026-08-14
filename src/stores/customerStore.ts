import { create } from 'zustand';
import type { Customer, CustomerStatus } from '../lib/types';
import { db } from '../lib/database';

interface CustomerFilters {
  status?: CustomerStatus;
  source?: string;
}

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  filters: CustomerFilters;
  loadCustomers: () => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Customer | null;
  updateCustomer: (id: string, customer: Partial<Customer>) => Customer | null;
  deleteCustomer: (id: string) => void;
  updateStatus: (id: string, status: CustomerStatus) => Customer | null;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  checkDuplicate: (name: string, phone?: string, email?: string) => boolean;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  searchQuery: '',
  filters: {},
  loadCustomers: () => {
    set({ loading: true });
    try {
      const allCustomers = db.getCustomers();
      const { searchQuery, filters } = get();
      
      let filtered = allCustomers;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
          c.customer_name.toLowerCase().includes(lowerQuery) || 
          (c.company_name && c.company_name.toLowerCase().includes(lowerQuery)) ||
          (c.contact_person && c.contact_person.toLowerCase().includes(lowerQuery)) ||
          (c.phone && c.phone.includes(lowerQuery)) ||
          (c.email && c.email.toLowerCase().includes(lowerQuery))
        );
      }

      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      if (filters.source) {
        filtered = filtered.filter(c => c.source === filters.source);
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
  deleteCustomer: (id) => {
    db.deleteCustomer(id);
    get().loadCustomers();
  },
  updateStatus: (id, status) => {
    const updated = db.updateCustomer(id, { status } as Partial<Customer>);
    if (updated) {
      get().loadCustomers();
    }
    return updated;
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadCustomers();
  },
  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
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
