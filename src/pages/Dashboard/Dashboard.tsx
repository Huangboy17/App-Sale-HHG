import { useState, useEffect, useMemo } from 'react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useSaleQuotationStore } from '../../stores/saleQuotationStore';
import { db } from '../../lib/database';
import { useSupabase } from '../../lib/supabaseClient';
import * as supaDb from '../../lib/supabaseDatabase';
import { formatVND, formatDate } from '../../lib/formatters';
import {
  OPPORTUNITY_STATUS_LABELS,
  PRIORITY_LABELS,
  DEFAULT_REJECTION_REASONS,
} from '../../lib/constants';
import type { Opportunity, SaleQuotation, User, Priority } from '../../lib/types';
import {
  TrendingUp, CheckCircle, AlertTriangle, AlertCircle, Clock,
  DollarSign, Target, Plus, RefreshCw, ChevronRight, X,
  FileText, Calendar, Filter, Award, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Modal } from '../../components/common/Modal';
import CustomerForm from '../Customers/CustomerForm';
import OpportunityForm from '../Opportunities/OpportunityForm';

// Probability mapping per stage according to Sales Ops methodology
const STAGE_PROBABILITIES: Record<string, number> = {
  LEAD: 0.10,        // 10%
  CONSULTING: 0.30,  // 30%
  QUOTING: 0.50,     // 50%
  SENT: 0.50,        // 50%
  NEGOTIATING: 0.80, // 80%
  WON: 1.00,         // 100%
  LOST: 0.00,        // 0%
};

const STAGE_COLORS: Record<string, string> = {
  LEAD: '#3B82F6',
  CONSULTING: '#06B6D4',
  QUOTING: '#F59E0B',
  SENT: '#EAB308',
  NEGOTIATING: '#F97316',
  WON: '#10B981',
  LOST: '#EF4444',
};

type TimeFilterOption = 'all' | 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

export default function Dashboard() {
  const { opportunities, loadOpportunities } = useOpportunityStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { quotations, loadAllQuotations } = useSaleQuotationStore();

  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Quick Action Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);

  // Drill-down Modal State
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    type: 'opportunities' | 'quotations' | 'customers';
    items: any[];
  }>({
    isOpen: false,
    title: '',
    type: 'opportunities',
    items: [],
  });

  const loadData = async () => {
    try {
      await Promise.all([
        loadOpportunities(),
        loadCustomers(),
        loadAllQuotations(),
      ]);
      const users = useSupabase() ? await supaDb.getUsers() : db.getUsers();
      setSalesUsers(users);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Date Range Computation ---
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (timeFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (timeFilter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
    } else if (timeFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
    } else if (timeFilter === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (timeFilter === 'custom') {
      if (customStartDate) start = new Date(customStartDate + 'T00:00:00');
      if (customEndDate) end = new Date(customEndDate + 'T23:59:59');
    }

    return { start, end };
  }, [timeFilter, customStartDate, customEndDate]);

  // --- Filtered Opportunities ---
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      // Sale Filter
      if (selectedSaleId !== 'all' && o.assigned_sale_id !== selectedSaleId) {
        return false;
      }
      // Priority Filter
      if (selectedPriority !== 'all' && o.priority !== selectedPriority) {
        return false;
      }
      // Time Filter
      if (dateRangeBounds.start || dateRangeBounds.end) {
        const itemDateStr = o.received_date || o.created_at;
        if (itemDateStr) {
          const itemDate = new Date(itemDateStr);
          if (dateRangeBounds.start && itemDate < dateRangeBounds.start) return false;
          if (dateRangeBounds.end && itemDate > dateRangeBounds.end) return false;
        }
      }
      return true;
    });
  }, [opportunities, selectedSaleId, selectedPriority, dateRangeBounds]);

  // --- Filtered Quotations ---
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (dateRangeBounds.start || dateRangeBounds.end) {
        const quoteDateStr = q.quotation_date || q.created_at;
        if (quoteDateStr) {
          const qDate = new Date(quoteDateStr);
          if (dateRangeBounds.start && qDate < dateRangeBounds.start) return false;
          if (dateRangeBounds.end && qDate > dateRangeBounds.end) return false;
        }
      }
      return true;
    });
  }, [quotations, dateRangeBounds]);

  // --- LEVEL 1: ACTION / ALERT CENTER ---
  const alerts = useMemo(() => {
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // 1. Báo giá quá hạn (> 7 ngày chưa chốt)
    const overdueQuotations = quotations.filter((q) => {
      if (q.status !== 'DRAFT' && q.status !== 'SENT') return false;
      const qTime = new Date(q.created_at || q.quotation_date).getTime();
      return now - qTime > SEVEN_DAYS_MS;
    });

    // 2. Cơ hội lâu chưa cập nhật (> 7 ngày)
    const staleOpportunities = opportunities.filter((o) => {
      if (['WON', 'LOST'].includes(o.status)) return false;
      const oTime = new Date(o.updated_at || o.created_at).getTime();
      return now - oTime > SEVEN_DAYS_MS;
    });

    // 3. Cơ hội giá trị cao cần ưu tiên (>= 50M hoặc HIGH / URGENT)
    const highValueOpportunities = opportunities.filter((o) => {
      if (['WON', 'LOST'].includes(o.status)) return false;
      return (o.estimated_value || 0) >= 50000000 || o.priority === 'HIGH' || o.priority === 'URGENT';
    });

    // 4. Cơ hội sắp đến hạn chốt (trong 7 ngày tới)
    const closingSoonOpportunities = opportunities.filter((o) => {
      if (['WON', 'LOST'].includes(o.status) || !o.expected_close_date) return false;
      const expTime = new Date(o.expected_close_date).getTime();
      return expTime >= now && expTime <= now + SEVEN_DAYS_MS;
    });

    return {
      overdueQuotations,
      staleOpportunities,
      highValueOpportunities,
      closingSoonOpportunities,
    };
  }, [quotations, opportunities]);

  // --- LEVEL 2: KPI METRICS (100% Real Data) ---
  const kpiMetrics = useMemo(() => {
    const activeOpps = filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status));
    const wonOpps = filteredOpportunities.filter((o) => o.status === 'WON');
    const lostOpps = filteredOpportunities.filter((o) => o.status === 'LOST');

    // Pipeline Value
    const pipelineValue = activeOpps.reduce((sum, o) => sum + (o.estimated_value || 0), 0);

    // Weighted Forecast
    const weightedForecast = activeOpps.reduce((sum, o) => {
      const prob = STAGE_PROBABILITIES[o.status] || 0.1;
      return sum + (o.estimated_value || 0) * prob;
    }, 0);

    // Won Revenue
    const wonRevenue = wonOpps.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
    const wonQuotationsCount = filteredQuotations.filter((q) => q.status === 'WON').length;
    const wonQuotationsValue = filteredQuotations
      .filter((q) => q.status === 'WON')
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);

    // Win Rate
    const totalFinished = wonOpps.length + lostOpps.length;
    const winRate = totalFinished > 0 ? Math.round((wonOpps.length / totalFinished) * 100) : 0;

    // Average Deal Size
    const avgDealSize = wonOpps.length > 0 ? Math.round(wonRevenue / wonOpps.length) : activeOpps.length > 0 ? Math.round(pipelineValue / activeOpps.length) : 0;

    return {
      activeCount: activeOpps.length,
      totalCount: filteredOpportunities.length,
      pipelineValue,
      weightedForecast,
      wonRevenue,
      wonCount: wonOpps.length,
      lostCount: lostOpps.length,
      winRate,
      avgDealSize,
      wonQuotationsCount,
      wonQuotationsValue,
    };
  }, [filteredOpportunities, filteredQuotations]);

  // --- LEVEL 3: LAYERED SALES FUNNEL ---
  const funnelStages = useMemo(() => {
    const stages = [
      { key: 'LEAD', label: 'Tiếp cận (Lead)', color: STAGE_COLORS.LEAD, prob: '10%' },
      { key: 'CONSULTING', label: 'Tư vấn (Consulting)', color: STAGE_COLORS.CONSULTING, prob: '30%' },
      { key: 'QUOTING', label: 'Báo giá (Quoting)', color: STAGE_COLORS.QUOTING, prob: '50%' },
      { key: 'NEGOTIATING', label: 'Đàm phán (Negotiating)', color: STAGE_COLORS.NEGOTIATING, prob: '80%' },
      { key: 'WON', label: 'Đã chốt (Won)', color: STAGE_COLORS.WON, prob: '100%' },
    ];

    let prevCount = 0;
    const totalPipeline = kpiMetrics.pipelineValue + kpiMetrics.wonRevenue;

    return stages.map((stage, idx) => {
      let matchingOpps: Opportunity[] = [];
      if (stage.key === 'QUOTING') {
        matchingOpps = filteredOpportunities.filter((o) => o.status === 'QUOTING' || o.status === 'SENT');
      } else {
        matchingOpps = filteredOpportunities.filter((o) => o.status === stage.key);
      }

      const count = matchingOpps.length;
      const value = matchingOpps.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
      const percentOfTotal = totalPipeline > 0 ? Math.round((value / totalPipeline) * 100) : 0;

      // Conversion rate from previous stage
      let conversionRate = 100;
      if (idx > 0 && prevCount > 0) {
        conversionRate = Math.min(100, Math.round((count / prevCount) * 100));
      } else if (idx > 0 && prevCount === 0) {
        conversionRate = count > 0 ? 100 : 0;
      }
      prevCount = count;

      return {
        ...stage,
        count,
        value,
        percentOfTotal,
        conversionRate: idx === 0 ? 100 : conversionRate,
        opps: matchingOpps,
      };
    });
  }, [filteredOpportunities, kpiMetrics.pipelineValue, kpiMetrics.wonRevenue]);

  // --- LEVEL 4: MONTHLY REVENUE & PIPELINE (Real Timeline Data) ---
  const monthlyTimelineData = useMemo(() => {
    const monthMap = new Map<string, { name: string; wonRevenue: number; pipelineValue: number; wonCount: number }>();

    // Scan opportunities to group by real creation/received month
    opportunities.forEach((o) => {
      const dateStr = o.received_date || o.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `T${d.getMonth() + 1}/${d.getFullYear()}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, { name: label, wonRevenue: 0, pipelineValue: 0, wonCount: 0 });
      }

      const entry = monthMap.get(key)!;
      if (o.status === 'WON') {
        entry.wonRevenue += o.estimated_value || 0;
        entry.wonCount += 1;
      } else if (o.status !== 'LOST') {
        entry.pipelineValue += o.estimated_value || 0;
      }
    });

    const sortedKeys = Array.from(monthMap.keys()).sort();
    if (sortedKeys.length === 0) {
      const now = new Date();
      return [{
        name: `T${now.getMonth() + 1}/${now.getFullYear()}`,
        wonRevenue: kpiMetrics.wonRevenue,
        pipelineValue: kpiMetrics.pipelineValue,
        wonCount: kpiMetrics.wonCount,
      }];
    }

    return sortedKeys.slice(-6).map((k) => monthMap.get(k)!);
  }, [opportunities, kpiMetrics.wonRevenue, kpiMetrics.pipelineValue, kpiMetrics.wonCount]);

  // --- LEVEL 5A: STATUS DISTRIBUTION ---
  const statusDistribution = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};

    filteredOpportunities.forEach((o) => {
      if (!counts[o.status]) {
        counts[o.status] = { count: 0, value: 0 };
      }
      counts[o.status].count += 1;
      counts[o.status].value += o.estimated_value || 0;
    });

    const total = filteredOpportunities.length || 1;

    return Object.entries(counts).map(([status, data]) => ({
      status,
      name: OPPORTUNITY_STATUS_LABELS[status] || status,
      count: data.count,
      value: data.value,
      percentage: Math.round((data.count / total) * 100),
      color: STAGE_COLORS[status] || '#64748B',
    }));
  }, [filteredOpportunities]);

  // --- LEVEL 5B: LOST REASONS BREAKDOWN ---
  const lostReasonsData = useMemo(() => {
    const lostOpps = filteredOpportunities.filter((o) => o.status === 'LOST');
    const counts: Record<string, number> = {};

    lostOpps.forEach((o) => {
      let label = 'Khác';
      if (o.rejection_reason_id) {
        const found = DEFAULT_REJECTION_REASONS.find((r) => r.value === o.rejection_reason_id);
        label = found?.label || o.rejection_reason_id;
      } else if (o.rejection_notes) {
        label = o.rejection_notes;
      }
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: lostOpps.length > 0 ? Math.round((count / lostOpps.length) * 100) : 0,
    }));
  }, [filteredOpportunities]);

  // --- LEVEL 6: TOP PRIORITY OPPORTUNITIES (Smart Ranking) ---
  const topPriorityOpportunities = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...filteredOpportunities]
      .filter((o) => !['WON', 'LOST'].includes(o.status))
      .sort((a, b) => {
        // 1. Sort by Priority (URGENT > HIGH > MEDIUM > LOW)
        const pA = priorityWeight[a.priority] || 2;
        const pB = priorityWeight[b.priority] || 2;
        if (pB !== pA) return pB - pA;

        // 2. Sort by Value descending
        const valDiff = (b.estimated_value || 0) - (a.estimated_value || 0);
        if (valDiff !== 0) return valDiff;

        // 3. Sort by Close Date ascending (closer deadline first)
        if (a.expected_close_date && b.expected_close_date) {
          return new Date(a.expected_close_date).getTime() - new Date(b.expected_close_date).getTime();
        }
        return 0;
      })
      .slice(0, 6);
  }, [filteredOpportunities]);

  // Drill-down Helper
  const openDrillDown = (title: string, items: any[], type: 'opportunities' | 'quotations' | 'customers' = 'opportunities', description?: string) => {
    setDrillDownModal({
      isOpen: true,
      title,
      description,
      type,
      items,
    });
  };

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.customer_name || 'Khách hàng';
  };

  const getSaleName = (saleId?: string) => {
    if (!saleId) return 'Chưa phân công';
    return salesUsers.find((u) => u.id === saleId)?.full_name || 'Sale';
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ============================================================
          HEADER & MULTI-DIMENSIONAL FILTERS & QUICK ACTIONS
          ============================================================ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Sales Command Center</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
              100% REAL DATA
            </span>
          </h1>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Tổng quan hiệu suất bán hàng, dự báo doanh số và cảnh báo tác vụ cần xử lý ngay
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            title="Làm mới dữ liệu"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <RefreshCw size={15} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCustomerModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <Plus size={15} />
            <span>Thêm Khách hàng</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsOpportunityModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>Tạo Cơ hội mới</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Filter size={16} />
            <span>Bộ lọc:</span>
          </div>

          {/* Time Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="form-control"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilterOption)}
              style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', height: 'auto', minWidth: '130px' }}
            >
              <option value="all">📅 Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="this_quarter">Quý này</option>
              <option value="this_year">Năm nay</option>
              <option value="custom">Tùy chỉnh...</option>
            </select>
          </div>

          {timeFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                className="form-control"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ fontSize: '0.8125rem', padding: '0.35rem 0.5rem', height: 'auto' }}
              />
              <span className="text-muted">đến</span>
              <input
                type="date"
                className="form-control"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ fontSize: '0.8125rem', padding: '0.35rem 0.5rem', height: 'auto' }}
              />
            </div>
          )}

          {/* Sale Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="form-control"
              value={selectedSaleId}
              onChange={(e) => setSelectedSaleId(e.target.value)}
              style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', height: 'auto', minWidth: '150px' }}
            >
              <option value="all">👤 Tất cả nhân viên Sale</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="form-control"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', height: 'auto', minWidth: '140px' }}
            >
              <option value="all">🎯 Tất cả mức ưu tiên</option>
              <option value="URGENT">Khẩn cấp (URGENT)</option>
              <option value="HIGH">Cao (HIGH)</option>
              <option value="MEDIUM">Trung bình (MEDIUM)</option>
              <option value="LOW">Thấp (LOW)</option>
            </select>
          </div>

          {(selectedSaleId !== 'all' || selectedPriority !== 'all' || timeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setTimeFilter('all');
                setSelectedSaleId('all');
                setSelectedPriority('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <X size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          LEVEL 1: ACTION / ALERT CENTER (CẦN XỬ LÝ NGAY)
          ============================================================ */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Tác vụ cần xử lý ngay
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Alert 1: Báo giá quá hạn */}
          <div
            onClick={() =>
              openDrillDown(
                'Báo giá cần xử lý / Quá hạn (> 7 ngày)',
                alerts.overdueQuotations,
                'quotations',
                'Các báo giá ở trạng thái Nháp hoặc Đã gửi quá 7 ngày chưa được phản hồi hoặc chốt'
              )
            }
            className="card"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid var(--danger)',
              background: alerts.overdueQuotations.length > 0 ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={15} />
                  <span>BÁO GIÁ QUÁ HẠN</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '0.25rem' }}>
                  {alerts.overdueQuotations.length}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Chưa phản hồi quá 7 ngày
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>

          {/* Alert 2: Cơ hội lâu chưa cập nhật */}
          <div
            onClick={() =>
              openDrillDown(
                'Cơ hội lâu chưa có tương tác (> 7 ngày)',
                alerts.staleOpportunities,
                'opportunities',
                'Các cơ hội đang mở chưa được cập nhật thông tin hoặc ghi nhận hoạt động trong 7 ngày qua'
              )
            }
            className="card"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid var(--warning)',
              background: alerts.staleOpportunities.length > 0 ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={15} />
                  <span>CƠ HỘI BỎ QUÊN</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '0.25rem' }}>
                  {alerts.staleOpportunities.length}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Chưa cập nhật &gt; 7 ngày
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>

          {/* Alert 3: Cơ hội giá trị cao cần ưu tiên */}
          <div
            onClick={() =>
              openDrillDown(
                'Cơ hội giá trị cao & Khẩn cấp',
                alerts.highValueOpportunities,
                'opportunities',
                'Các cơ hội có giá trị lớn (>= 50 triệu) hoặc được gắn mức ưu tiên CAO / KHẨN CẤP'
              )
            }
            className="card"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid var(--primary)',
              background: alerts.highValueOpportunities.length > 0 ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={15} />
                  <span>CƠ HỘI TRỌNG ĐIỂM</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '0.25rem' }}>
                  {alerts.highValueOpportunities.length}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Giá trị lớn / Ưu tiên cao
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>

          {/* Alert 4: Sắp đến hạn chốt */}
          <div
            onClick={() =>
              openDrillDown(
                'Cơ hội sắp đến hạn chốt trong tuần',
                alerts.closingSoonOpportunities,
                'opportunities',
                'Các cơ hội có ngày dự kiến chốt (Expected Close Date) trong vòng 7 ngày tới'
              )
            }
            className="card"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid var(--info)',
              background: alerts.closingSoonOpportunities.length > 0 ? 'rgba(8, 145, 178, 0.06)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} />
                  <span>HẠN CHỐT TRONG TUẦN</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '0.25rem' }}>
                  {alerts.closingSoonOpportunities.length}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Dự kiến chốt 7 ngày tới
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          LEVEL 2: EXECUTIVE KPI METRICS (4 PRIMARY CARDS + RIBBON)
          ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* KPI 1: Tổng cơ hội */}
        <div
          onClick={() =>
            openDrillDown(
              'Danh sách cơ hội đang mở',
              filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status)),
              'opportunities'
            )
          }
          className="kpi-card"
          style={{ borderTop: '3px solid var(--primary)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">Cơ hội đang mở / Tổng</div>
              <div className="kpi-value">
                {kpiMetrics.activeCount}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  / {kpiMetrics.totalCount}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                Đang theo đuổi trong Pipeline
              </div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(22, 119, 255, 0.1)', color: 'var(--primary)' }}>
              <Target size={24} />
            </div>
          </div>
        </div>

        {/* KPI 2: Giá trị Pipeline */}
        <div
          onClick={() =>
            openDrillDown(
              'Pipeline chi tiết các cơ hội',
              filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status)),
              'opportunities'
            )
          }
          className="kpi-card"
          style={{ borderTop: '3px solid var(--info)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">Tổng Giá trị Pipeline</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--info)' }}>
                {formatVND(kpiMetrics.pipelineValue)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                Tổng quy mô hợp đồng tiềm năng
              </div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--info)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* KPI 3: Weighted Forecast */}
        <div
          onClick={() =>
            openDrillDown(
              'Cơ hội tính dự báo doanh số (Weighted Forecast)',
              filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status)),
              'opportunities',
              'Dự báo doanh số được tính theo tỷ trọng xác suất từng giai đoạn: Chốt 100%, Đàm phán 80%, Báo giá 50%, Tư vấn 30%, Lead 10%'
            )
          }
          className="kpi-card"
          style={{ borderTop: '3px solid var(--warning)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">Dự báo chốt (Weighted)</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>
                {formatVND(kpiMetrics.weightedForecast)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                Ước tính theo xác suất giai đoạn
              </div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              <Award size={24} />
            </div>
          </div>
        </div>

        {/* KPI 4: Doanh số đã chốt */}
        <div
          onClick={() =>
            openDrillDown(
              'Danh sách cơ hội đã chốt (WON)',
              filteredOpportunities.filter((o) => o.status === 'WON'),
              'opportunities'
            )
          }
          className="kpi-card"
          style={{ borderTop: '3px solid var(--success)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-title">Doanh số đã chốt (Won)</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                {formatVND(kpiMetrics.wonRevenue)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                {kpiMetrics.wonCount} cơ hội chốt thành công
              </div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY PERFORMANCE RIBBON */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.5rem',
          marginBottom: '1.75rem',
          background: 'var(--bg-surface-light)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 12px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Tỷ lệ thắng (Win Rate)</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {kpiMetrics.winRate}%{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                ({kpiMetrics.wonCount} chốt / {kpiMetrics.wonCount + kpiMetrics.lostCount} hoàn tất)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Quy mô Deal trung bình</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {formatVND(kpiMetrics.avgDealSize)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Báo giá đã chốt</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {kpiMetrics.wonQuotationsCount} đơn{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                ({formatVND(kpiMetrics.wonQuotationsValue)})
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
            <Target size={20} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Tổng khách hàng</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {customers.length} khách hàng
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          LEVEL 3 & LEVEL 4: LAYERED SALES FUNNEL & REVENUE TIMELINE
          ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Layered Sales Funnel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Phễu Bán Hàng Phân Tầng (Sales Funnel)
              </h3>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Tỷ lệ chuyển đổi và giá trị từng giai đoạn cơ hội
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {funnelStages.map((stage) => (
              <div
                key={stage.key}
                onClick={() => openDrillDown(`Cơ hội giai đoạn: ${stage.label}`, stage.opps, 'opportunities')}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--bg-surface-light)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface-light)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({stage.prob})
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-heading)' }}>
                      {stage.count} cơ hội
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: stage.color, marginLeft: '0.75rem', fontWeight: 600 }}>
                      {formatVND(stage.value)}
                    </span>
                  </div>
                </div>

                {/* Progress bar and conversion rate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(5, Math.min(100, stage.percentOfTotal))}%`,
                        height: '100%',
                        background: stage.color,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '85px', textAlign: 'right' }}>
                    Conv: <strong style={{ color: 'var(--text-main)' }}>{stage.conversionRate}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue & Pipeline Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Doanh Số Thực Tế & Pipeline Theo Tháng
              </h3>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Dữ liệu thực tế từ các đơn hàng và cơ hội kinh doanh
              </p>
            </div>
          </div>

          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTimelineData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  formatter={(value: any, name: any) => [
                    formatVND(value),
                    name === 'wonRevenue' ? 'Doanh số đã chốt' : 'Pipeline đang theo đuổi',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'wonRevenue' ? 'Doanh số đã chốt (Won)' : 'Pipeline đang theo đuổi')}
                />
                <Bar dataKey="wonRevenue" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="pipelineValue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============================================================
          LEVEL 5: OPPORTUNITY STATUS & LOSS REASONS ANALYSIS
          ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Status Distribution (Donut Chart + Detailed Legend) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>
            Cơ Cấu Trạng Thái Cơ Hội
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} cơ hội (${formatVND(item.payload.value)})`,
                      item.payload.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Legend Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
              {statusDistribution.map((item) => (
                <div
                  key={item.status}
                  onClick={() =>
                    openDrillDown(
                      `Cơ hội: ${item.name}`,
                      filteredOpportunities.filter((o) => o.status === item.status),
                      'opportunities'
                    )
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.count}</span>
                    <span className="text-muted" style={{ marginLeft: '0.5rem' }}>({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lost Reasons Analysis */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            Phân Tích Lý Do Mất Khách (Lost Analysis)
          </h3>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '1.25rem' }}>
            Dữ liệu thống kê nguyên nhân không chốt được đơn hàng
          </p>

          {lostReasonsData.length > 0 ? (
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lostReasonsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={110} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                    formatter={(val: any) => [`${val} cơ hội`, 'Số lượng']}
                  />
                  <Bar dataKey="count" fill="var(--danger)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
                textAlign: 'center',
                padding: '1rem',
              }}
            >
              <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem', opacity: 0.8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                Không có cơ hội bị từ chối trong kỳ lọc
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Tất cả cơ hội hiện tại đang được xử lý hoặc đã chốt thành công!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          LEVEL 6: TOP PRIORITY OPPORTUNITIES MATRIX
          ============================================================ */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cơ Hội Cần Ưu Tiên Xử Lý (Priority Matrix)
            </h3>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Xếp hạng thông minh theo Mức độ khẩn cấp, Giá trị cơ hội và Hạn dự kiến chốt
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              openDrillDown(
                'Tất cả cơ hội đang mở',
                filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status)),
                'opportunities'
              )
            }
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
          >
            Xem toàn bộ ({filteredOpportunities.filter((o) => !['WON', 'LOST'].includes(o.status)).length})
          </button>
        </div>

        {topPriorityOpportunities.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Cơ Hội</th>
                  <th>Khách Hàng</th>
                  <th style={{ textAlign: 'right' }}>Giá Trị Dự Kiến</th>
                  <th>Giai Đoạn</th>
                  <th>Mức Ưu Tiên</th>
                  <th>Hạn Dự Kiến Chốt</th>
                  <th>Sale Phụ Trách</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {topPriorityOpportunities.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {o.opportunity_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                        {getCustomerName(o.customer_id)}
                      </div>
                      {o.requirements && (
                        <div className="text-muted" style={{ fontSize: '0.75rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.requirements}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9375rem' }}>
                      {formatVND(o.estimated_value || 0)}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${STAGE_COLORS[o.status] || '#3B82F6'}20`,
                          color: STAGE_COLORS[o.status] || '#3B82F6',
                          border: `1px solid ${STAGE_COLORS[o.status] || '#3B82F6'}40`,
                        }}
                      >
                        {OPPORTUNITY_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: o.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.15)' : o.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.06)',
                          color: o.priority === 'URGENT' ? 'var(--danger)' : o.priority === 'HIGH' ? 'var(--warning)' : 'var(--text-muted)',
                        }}
                      >
                        {PRIORITY_LABELS[o.priority] || o.priority}
                      </span>
                    </td>
                    <td>
                      {o.expected_close_date ? (
                        <div style={{ fontSize: '0.8125rem' }}>
                          {formatDate(o.expected_close_date)}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Chưa đặt</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {getSaleName(o.assigned_sale_id)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openDrillDown(`Chi tiết cơ hội ${o.opportunity_code}`, [o], 'opportunities')}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
            }}
          >
            <Target size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-heading)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Chưa có cơ hội bán hàng nào trong kỳ lọc
            </h4>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Hãy tạo cơ hội mới để bắt đầu theo dõi tiến độ và dự báo doanh số
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsOpportunityModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>+ Tạo cơ hội ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          DRILL-DOWN MODAL
          ============================================================ */}
      {drillDownModal.isOpen && (
        <Modal
          isOpen={drillDownModal.isOpen}
          onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
          title={drillDownModal.title}
          size="lg"
        >
          <div>
            {drillDownModal.description && (
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {drillDownModal.description}
              </p>
            )}

            {drillDownModal.items.length > 0 ? (
              <div className="data-table-wrapper" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    {drillDownModal.type === 'opportunities' ? (
                      <tr>
                        <th>Mã Cơ Hội</th>
                        <th>Khách Hàng</th>
                        <th style={{ textAlign: 'right' }}>Giá Trị</th>
                        <th>Giai Đoạn</th>
                        <th>Ưu Tiên</th>
                        <th>Hạn Chốt</th>
                      </tr>
                    ) : drillDownModal.type === 'quotations' ? (
                      <tr>
                        <th>Mã Báo Giá</th>
                        <th>Khách Hàng</th>
                        <th>Ngày Tạo</th>
                        <th>Trạng Thái</th>
                        <th style={{ textAlign: 'right' }}>Tổng Tiền</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Tên Khách Hàng</th>
                        <th>Công Ty</th>
                        <th>SĐT</th>
                        <th>Trạng Thái</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {drillDownModal.type === 'opportunities' &&
                      drillDownModal.items.map((item: Opportunity) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.opportunity_code}</td>
                          <td>{getCustomerName(item.customer_id)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatVND(item.estimated_value || 0)}</td>
                          <td>
                            <span className="badge badge-info">{OPPORTUNITY_STATUS_LABELS[item.status] || item.status}</span>
                          </td>
                          <td>{PRIORITY_LABELS[item.priority] || item.priority}</td>
                          <td>{item.expected_close_date ? formatDate(item.expected_close_date) : '-'}</td>
                        </tr>
                      ))}

                    {drillDownModal.type === 'quotations' &&
                      drillDownModal.items.map((item: SaleQuotation) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.quotation_code}</td>
                          <td>{getCustomerName(item.customer_id)}</td>
                          <td>{formatDate(item.quotation_date || item.created_at)}</td>
                          <td>
                            <span className="badge badge-warning">{item.status}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatVND(item.total_amount || 0)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Không có dữ liệu trong danh sách này
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* QUICK ACTION MODALS */}
      {isCustomerModalOpen && (
        <CustomerForm
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            loadData();
          }}
        />
      )}

      {isOpportunityModalOpen && (
        <OpportunityForm
          isOpen={isOpportunityModalOpen}
          onClose={() => {
            setIsOpportunityModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
