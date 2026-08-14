// ============================================================
// Customer Store (Zustand) - Supports Supabase & localStorage
// ============================================================

import { create } from 'zustand';
import type { Customer, CustomerStatus } from '../lib/types';
import { db } from '../lib/database';
import { useSupabase } from '../lib/supabaseClient';
import * as supaDb from '../lib/supabaseDatabase';

interface CustomerFilters {
  status?: CustomerStatus;
  source?: string;
}

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  filters: CustomerFilters;
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer | null>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<void>;
  updateStatus: (id: string, status: CustomerStatus) => Promise<Customer | null>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  checkDuplicate: (name: string, phone?: string, email?: string) => Promise<boolean>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  searchQuery: '',
  filters: {},

  loadCustomers: async () => {
    set({ loading: true });
    try {
      const allCustomers = useSupabase()
        ? await supaDb.getCustomers()
        : db.getCustomers();

      const { searchQuery, filters } = get();

      let filtered = allCustomers;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.customer_name.toLowerCase().includes(lowerQuery) ||
            (c.company_name && c.company_name.toLowerCase().includes(lowerQuery)) ||
            (c.contact_person && c.contact_person.toLowerCase().includes(lowerQuery)) ||
            (c.phone && c.phone.includes(lowerQuery)) ||
            (c.email && c.email.toLowerCase().includes(lowerQuery))
        );
      }

      if (filters.status) {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
      if (filters.source) {
        filtered = filtered.filter((c) => c.source === filters.source);
      }

      set({ customers: filtered, loading: false });
    } catch (error) {
      console.error('Failed to load customers', error);
      set({ loading: false });
    }
  },

  addCustomer: async (customerData) => {
    try {
      let newCustomer: Customer | null = null;
      if (useSupabase()) {
        newCustomer = await supaDb.createCustomer(customerData);
      } else {
        newCustomer = db.createCustomer(customerData);
      }
      if (newCustomer) {
        await get().loadCustomers();
      }
      return newCustomer;
    } catch (err) {
      console.error('Failed to add customer', err);
      return null;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      let updated: Customer | null = null;
      if (useSupabase()) {
        updated = await supaDb.updateCustomer(id, customerData);
      } else {
        updated = db.updateCustomer(id, customerData);
      }
      if (updated) {
        await get().loadCustomers();
      }
      return updated;
    } catch (err) {
      console.error('Failed to update customer', err);
      return null;
    }
  },

  deleteCustomer: async (id) => {
    try {
      if (useSupabase()) {
        await supaDb.deleteCustomer(id);
      } else {
        db.deleteCustomer(id);
      }
      await get().loadCustomers();
    } catch (err) {
      console.error('Failed to delete customer', err);
    }
  },

  updateStatus: async (id, status) => {
    const updated = await get().updateCustomer(id, { status } as Partial<Customer>);
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

  checkDuplicate: async (name, phone, email) => {
    const allCustomers = useSupabase()
      ? await supaDb.getCustomers()
      : db.getCustomers();

    return allCustomers.some(
      (c) =>
        c.customer_name.toLowerCase() === name.toLowerCase() ||
        (phone && c.phone === phone) ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    );
  },
}));
