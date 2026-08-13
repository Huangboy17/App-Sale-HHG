import { useEffect, useMemo } from 'react';
import { useOpportunityStore } from '../../stores/opportunityStore';
import { useCustomerStore } from '../../stores/customerStore';
import { formatVND } from '../../lib/formatters';
import { OPPORTUNITY_STATUS_COLORS, OPPORTUNITY_STATUS_LABELS } from '../../lib/constants';
import { Target, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { 
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

export default function Dashboard() {
  const { opportunities, loadOpportunities } = useOpportunityStore();
  const { customers, loadCustomers } = useCustomerStore();

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
  }, [loadOpportunities, loadCustomers]);

  const kpis = useMemo(() => {
    let total = opportunities.length;
    let negotiating = 0;
    let won = 0;
    let wonValue = 0;
    let lost = 0;

    opportunities.forEach(o => {
      if (o.status === 'NEGOTIATING') negotiating++;
      if (o.status === 'WON') {
        won++;
        wonValue += o.estimated_value || 0;
      }
      if (o.status === 'LOST') lost++;
    });

    return { total, negotiating, won, wonValue, lost };
  }, [opportunities]);

  const funnelData = useMemo(() => {
    const counts = {
      LEAD: 0,
      CONSULTING: 0,
      QUOTING: 0,
      NEGOTIATING: 0,
      WON: 0
    };
    
    opportunities.forEach(o => {
      if (counts[o.status as keyof typeof counts] !== undefined) {
        counts[o.status as keyof typeof counts]++;
      }
    });

    return [
      { name: 'Lead', value: counts.LEAD, fill: '#60a5fa' },
      { name: 'Tư vấn', value: counts.CONSULTING, fill: '#3b82f6' },
      { name: 'Báo giá', value: counts.QUOTING, fill: '#2563eb' },
      { name: 'Đàm phán', value: counts.NEGOTIATING, fill: '#1d4ed8' },
      { name: 'Đã chốt', value: counts.WON, fill: '#10b981' }
    ].filter(d => d.value > 0);
  }, [opportunities]);

  const priorityData = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    opportunities.forEach(o => {
      if (counts[o.priority as keyof typeof counts] !== undefined) {
        counts[o.priority as keyof typeof counts]++;
      }
    });
    
    return [
      { name: 'Thấp', value: counts.LOW, color: '#9ca3af' },
      { name: 'Trung bình', value: counts.MEDIUM, color: '#60a5fa' },
      { name: 'Cao', value: counts.HIGH, color: '#f59e0b' },
      { name: 'Khẩn cấp', value: counts.URGENT, color: '#ef4444' }
    ];
  }, [opportunities]);

  const recentOpportunities = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [opportunities]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Tổng quan Kinh doanh</h1>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Tổng Cơ Hội</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.total}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Target size={24} /></div>
          </div>
        </div>
        
        <div className="card border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Đang Đàm Phán</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.negotiating}</h3>
            </div>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><AlertTriangle size={24} /></div>
          </div>
        </div>

        <div className="card border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Đã Chốt (Đơn)</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.won}</h3>
              <p className="text-xs text-green-600 font-medium mt-1">~ {formatVND(kpis.wonValue)}</p>
            </div>
            <div className="p-2 bg-green-50 text-green-500 rounded-lg"><CheckCircle size={24} /></div>
          </div>
        </div>

        <div className="card border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Đã Mất (Đơn)</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.lost}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-500 rounded-lg"><XCircle size={24} /></div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Phễu Bán Hàng</h3>
          <div className="h-[300px]">
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Không đủ dữ liệu</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cơ hội theo Mức độ Ưu tiên</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cơ hội gần đây</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>Giá trị</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOpportunities.length > 0 ? recentOpportunities.map(o => (
                  <tr key={o.id}>
                    <td className="font-medium text-blue-600">{o.opportunity_code}</td>
                    <td>{customers.find(c => c.id === o.customer_id)?.customer_name || '-'}</td>
                    <td>{formatVND(o.estimated_value || 0)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${OPPORTUNITY_STATUS_COLORS[o.status]}-100 text-${OPPORTUNITY_STATUS_COLORS[o.status]}-800`}>
                        {OPPORTUNITY_STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-4">Chưa có cơ hội nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Sản phẩm bán chạy</h3>
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-400">
              <p className="font-medium">Chưa có dữ liệu thống kê sản phẩm</p>
              <p className="text-sm">Tính năng sẽ hoàn thiện ở Phase 2 (Quản lý Đơn hàng)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
