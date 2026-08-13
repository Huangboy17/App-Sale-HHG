import { create } from 'zustand';
import type { Opportunity, OpportunityStatus, Priority } from '../lib/types';
import { db } from '../lib/database';

interface OpportunityStats {
  byStatus: Record<OpportunityStatus, { count: number, value: number }>;
  totalCount: number;
  totalValue: number;
}

interface OpportunityFilters {
  status?: OpportunityStatus;
  priority?: Priority;
}

interface OpportunityState {
  opportunities: Opportunity[];
  loading: boolean;
  searchQuery: string;
  filters: OpportunityFilters;
  loadOpportunities: () => void;
  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'opportunity_code'>) => Opportunity | null;
  updateOpportunity: (id: string, opportunity: Partial<Opportunity>) => Opportunity | null;
  updateStatus: (id: string, status: OpportunityStatus) => Opportunity | null;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<OpportunityFilters>) => void;
  getStats: () => OpportunityStats;
  getOpportunitiesByCustomer: (customerId: string) => Opportunity[];
  getOpportunitiesByProject: (projectId: string) => Opportunity[];
}

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  opportunities: [],
  loading: false,
  searchQuery: '',
  filters: {},
  loadOpportunities: () => {
    set({ loading: true });
    try {
      const allOpps = db.getOpportunities();
      const { searchQuery, filters } = get();
      
      let filtered = allOpps;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(o => 
          o.opportunity_code.toLowerCase().includes(lowerQuery)
        );
      }
      
      if (filters.status) filtered = filtered.filter(o => o.status === filters.status);
      if (filters.priority) filtered = filtered.filter(o => o.priority === filters.priority);
      
      set({ opportunities: filtered, loading: false });
    } catch (error) {
      console.error('Failed to load opportunities', error);
      set({ loading: false });
    }
  },
  addOpportunity: (opportunityData) => {
    const newOpp = db.createOpportunity(opportunityData);
    if (newOpp) {
      get().loadOpportunities();
    }
    return newOpp;
  },
  updateOpportunity: (id, opportunityData) => {
    const updated = db.updateOpportunity(id, opportunityData);
    if (updated) {
      get().loadOpportunities();
    }
    return updated;
  },
  updateStatus: (id, status) => {
    const updated = db.updateOpportunity(id, { status });
    if (updated) {
      get().loadOpportunities();
    }
    return updated;
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().loadOpportunities();
  },
  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().loadOpportunities();
  },
  getStats: () => {
    const allOpps = db.getOpportunities();
    
    const stats: OpportunityStats = {
      byStatus: {} as Record<OpportunityStatus, { count: number, value: number }>,
      totalCount: 0,
      totalValue: 0,
    };
    
    // Initialize
    const statuses: OpportunityStatus[] = ['LEAD', 'CONSULTING', 'QUOTING', 'SENT', 'NEGOTIATING', 'WON', 'LOST'];
    statuses.forEach(s => {
      stats.byStatus[s] = { count: 0, value: 0 };
    });
    
    allOpps.forEach(opp => {
      if (stats.byStatus[opp.status]) {
        stats.byStatus[opp.status].count += 1;
        stats.byStatus[opp.status].value += opp.estimated_value || 0;
      }
      stats.totalCount += 1;
      stats.totalValue += opp.estimated_value || 0;
    });
    
    return stats;
  },
  getOpportunitiesByCustomer: (customerId) => {
    return db.getOpportunities().filter(o => o.customer_id === customerId);
  },
  getOpportunitiesByProject: (projectId) => {
    return db.getOpportunities().filter(o => o.project_id === projectId);
  }
}));
