import React, { useEffect, useState } from 'react';
import { getFullAnalytics } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Award,
  Download,
  Calendar
} from 'lucide-react';

const COLORS = ['#0284c7', '#38bdf8', '#7c3aed', '#eab308', '#ea580c', '#10b981', '#dc2626'];
const STATUS_COLORS: Record<string, string> = {
  'Verified': '#10b981',
  'Pending Review': '#f59e0b',
  'Needs Review': '#d97706',
  'Suspicious': '#ef4444'
};

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFullAnalytics()
      .then((res) => setData(res))
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        Aggregating national meteorological intelligence & training metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            National Weather Intelligence & Big Data Analytics
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              10 LIVE TELEMETRY CHARTS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical distributions, multi-source ingestion velocity, state vulnerability rankings, and AI insights.
          </p>
        </div>
      </div>

      {/* Section 58: Human-Readable AI Insights Cards */}
      <div className="bg-[#121b2d] p-5 rounded-xl border border-[#1e293b] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <Brain className="w-4 h-4 text-sky-400" />
          <span>Real-time AI Narrative Intelligence Insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.ai_insights?.map((ins: any) => (
            <div key={ins.id} className="bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-sky-400 font-bold uppercase">{ins.category}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded ${
                      ins.impact_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400'
                        : ins.impact_level === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {ins.impact_level}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-sans font-medium">
                  "{ins.insight_text}"
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-[#1e293b]">
                {ins.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 24: 10 Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reports Over Time */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            1. Ingestion Volume Over Time (24h Window)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.reports_over_time}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorReports)" name="Reports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Events by Category */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            2. Weather Events by Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.events_by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} interval={0} angle={-20} textAnchor="end" height={40} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Active Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Events by State */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            3. Active Incidents by State
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.events_by_state} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={10} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Verified vs Suspicious */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            4. Verification & Trust Status Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.verified_vs_suspicious}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.verified_vs_suspicious.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.label] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Reports by Source */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            5. Ingestion Share by Source Type
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.reports_by_source}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Severity Distribution */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            6. Severity Level Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.severity_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#f87171" radius={[4, 4, 0, 0]} name="Total Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Top Affected Cities */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            7. Top Affected Indian Urban Centers
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_affected_cities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Active Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Hourly Reporting Pattern */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            8. Diurnal Hourly Reporting Velocity
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourly_pattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Avg Velocity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 9: Event Growth Trend */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            9. Event Growth & Clustering Trajectory
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.event_growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} name="Total Events" />
                <Line type="monotone" dataKey="secondary_value" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" name="Verified Events" />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 10: AI Classification Performance */}
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            10. AI/ML Pipeline Precision & Validation Metrics (%)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ai_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1626', borderColor: '#1e293b', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} name="Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 25: State Analytics Ranking Table */}
      <div className="bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
            <Award className="w-4 h-4 text-amber-400" />
            <span>State Weather Impact & Vulnerability Rankings</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Section 25 National Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-4">Rank</th>
                <th className="py-2.5 px-4">State / Territory</th>
                <th className="py-2.5 px-4">Active Events</th>
                <th className="py-2.5 px-4">Total Reports</th>
                <th className="py-2.5 px-4">Dominant Threat</th>
                <th className="py-2.5 px-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {data.state_rankings?.map((st: any, idx: number) => (
                <tr key={st.state} className="hover:bg-[#18233a] transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-400 font-bold">#{idx + 1}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-200">{st.state}</td>
                  <td className="py-2.5 px-4 font-mono text-sky-400 font-bold">{st.events_count}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">{st.reports_count.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-slate-300">{st.top_event_category}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        st.severity_level === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {st.severity_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
