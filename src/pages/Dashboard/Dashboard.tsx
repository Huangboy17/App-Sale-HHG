import { useEffect, useMemo } from 'react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { formatVND } from '../../lib/formatters';
import { OPPORTUNITY_STATUS_LABELS } from '../../lib/constants';
import { Target, TrendingUp, CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { 
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts';

export default function Dashboard() {
  const { opportunities, loadOpportunities } = useOpportunityStore();
  const { customers, loadCustomers } = useCustomerStore();

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
  }, [loadOpportunities, loadCustomers]);

  const kpis = useMemo(() => {
    let totalOpp = opportunities.length;
    let pipelineValue = 0;
    let expectedWon = 0;
    let wonValue = 0;

    opportunities.forEach(o => {
      if (['LEAD', 'CONSULTING', 'QUOTING', 'SENT', 'NEGOTIATING'].includes(o.status)) {
        pipelineValue += o.estimated_value || 0;
        if (o.status === 'NEGOTIATING' || o.status === 'SENT') {
          expectedWon += o.estimated_value || 0;
        }
      }
      if (o.status === 'WON') {
        wonValue += o.estimated_value || 0;
      }
    });

    return { totalOpp, pipelineValue, expectedWon, wonValue };
  }, [opportunities]);

  const funnelData = useMemo(() => {
    const counts = { LEAD: 0, CONSULTING: 0, QUOTING: 0, NEGOTIATING: 0, WON: 0 };
    opportunities.forEach(o => {
      if (counts[o.status as keyof typeof counts] !== undefined) {
        counts[o.status as keyof typeof counts]++;
      }
    });

    return [
      { name: 'Lead', value: counts.LEAD, fill: '#1677FF' },
      { name: 'Tư vấn', value: counts.CONSULTING, fill: '#0958d9' },
      { name: 'Báo giá', value: counts.QUOTING, fill: '#F59E0B' },
      { name: 'Đàm phán', value: counts.NEGOTIATING, fill: '#D97706' },
      { name: 'Đã chốt', value: counts.WON, fill: '#10B981' }
    ].filter(d => d.value > 0);
  }, [opportunities]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    opportunities.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: OPPORTUNITY_STATUS_LABELS[status] || status,
      value: count
    }));
  }, [opportunities]);

  const lostReasonsData = useMemo(() => {
    const counts: Record<string, number> = {};
    opportunities.filter(o => o.status === 'LOST').forEach(o => {
      const reason = o.rejection_notes || 'Khác';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({
      name: reason,
      value: count
    }));
  }, [opportunities]);

  const revenueByMonth = useMemo(() => {
    return [
      { name: 'T1', revenue: 120000000 },
      { name: 'T2', revenue: 150000000 },
      { name: 'T3', revenue: 180000000 },
      { name: 'T4', revenue: 140000000 },
      { name: 'T5', revenue: 210000000 },
      { name: 'T6', revenue: kpis.wonValue }
    ];
  }, [kpis.wonValue]);

  const topOpportunities = useMemo(() => {
    return [...opportunities]
      .filter(o => o.status !== 'LOST' && o.status !== 'WON')
      .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 5);
  }, [opportunities]);

  const COLORS = ['#1677FF', '#10B981', '#F59E0B', '#EF4444', '#0891b2', '#8b5cf6'];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl">Tổng quan Kinh doanh</h1>
      </div>

      {/* CẦN XỬ LÝ */}
      <div className="card mb-4" style={{ borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--warning)' }}>
          <AlertTriangle size={20} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>CẦN XỬ LÝ GẤP</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertCircle size={16} className="text-danger" />
            <span>3 Báo giá quá hạn phản hồi</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock size={16} className="text-warning" />
            <span>5 Cơ hội chưa cập nhật &gt; 7 ngày</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="dashboard-grid">
        <div className="kpi-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="kpi-title">Tổng Cơ Hội (Đang mở)</div>
              <div className="kpi-value">{kpis.totalOpp}</div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(22, 119, 255, 0.1)', color: 'var(--primary)' }}><Target size={24} /></div>
          </div>
        </div>
        
        <div className="kpi-card" style={{ borderTop: '3px solid var(--info)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="kpi-title">Giá trị Pipeline</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{formatVND(kpis.pipelineValue)}</div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--info)' }}><TrendingUp size={24} /></div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="kpi-title">Dự kiến chốt</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{formatVND(kpis.expectedWon)}</div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}><AlertTriangle size={24} /></div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="kpi-title">Đã chốt (Tháng này)</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{formatVND(kpis.wonValue)}</div>
            </div>
            <div className="btn-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="card">
          <h3 className="mb-4 text-sm text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Phễu Bán Hàng</h3>
          <div style={{ height: '300px' }}>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="var(--text-main)" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted">Không đủ dữ liệu</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Doanh số theo tháng</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => (val / 1000000) + "M"} />
                <Tooltip 
                  formatter={(value: any) => formatVND(value)}
                  contentStyle={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Trạng thái Cơ hội</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Lý do mất khách</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lostReasonsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="var(--danger)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="card">
        <h3 className="mb-4 text-sm text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Top Cơ Hội Tiềm Năng Nhất</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Cơ Hội</th>
                <th>Khách hàng</th>
                <th>Giá trị dự kiến</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {topOpportunities.length > 0 ? topOpportunities.map(o => (
                <tr key={o.id}>
                  <td style={{ color: 'var(--primary)', fontWeight: 500 }}>{o.opportunity_code}</td>
                  <td>{customers.find(c => c.id === o.customer_id)?.customer_name || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{formatVND(o.estimated_value || 0)}</td>
                  <td>
                    <span className="badge badge-info">
                      {OPPORTUNITY_STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
