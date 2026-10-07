import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Calendar,
  Zap,
  FileText,
  Search,
  RefreshCw,
  MapPin,
  Filter,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { getReports } from '../services/api';
import { WeatherReport } from '../types';
import { formatIngestionDate, getTimeAgo, getTimeClassification } from '../utils/dateFormatter';

export const AdminPanel: React.FC = () => {
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);

  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. M. Ravichandran', role: 'ADMIN', dept: 'Ministry of Earth Sciences (MoES)', username: 'admin', email: 'admin@weatherpulse.gov.in', status: 'ACTIVE' },
    { id: 2, name: 'Dr. Mrutyunjay Mohapatra', role: 'ANALYST', dept: 'India Meteorological Department (IMD)', username: 'analyst', email: 'analyst@weatherpulse.gov.in', status: 'PENDING' },
    { id: 3, name: 'Duty Verification Officer', role: 'VERIFIER', dept: 'National Weather Watch Center', username: 'verifier', email: 'verifier@imd.gov.in', status: 'PENDING' },
    { id: 4, name: 'NDRF Control Room', role: 'VIEWER', dept: 'National Disaster Response Force', username: 'ndrf_ops', email: 'ndrf@ndma.gov.in', status: 'ACTIVE' }
  ]);

  // Reports Ingestion State
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'JUST_INGESTED' | 'LAST_1H' | 'TODAY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const fetchIngestedReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getReports({ limit: 100 });
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports for admin panel:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchIngestedReports();
  }, []);

  const handleApprove = (id: number) => {
    setToastMsg({ text: 'Approving user...', type: 'loading' });
    setTimeout(() => {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'ACTIVE' } : u));
      setToastMsg({ text: '✅ User approved successfully!', type: 'success' });
      setTimeout(() => setToastMsg(null), 3000);
    }, 1000);
  };

  const handleReject = (id: number) => {
    setToastMsg({ text: 'Rejecting user...', type: 'loading' });
    setTimeout(() => {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'REJECTED' } : u));
      setToastMsg({ text: 'User access rejected.', type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
    }, 1000);
  };

  // Helper calculation for Time Buckets
  const now = new Date();

  const justIngestedCount = reports.filter(r => {
    const d = new Date(r.ingested_at || r.reported_at);
    return (now.getTime() - d.getTime()) / (1000 * 60) <= 15;
  }).length;

  const last1hCount = reports.filter(r => {
    const d = new Date(r.ingested_at || r.reported_at);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60) <= 1;
  }).length;

  const todayCount = reports.filter(r => {
    const d = new Date(r.ingested_at || r.reported_at);
    return d.toDateString() === now.toDateString();
  }).length;

  // Filtered and Sorted Reports
  const filteredReports = reports.filter(r => {
    const d = new Date(r.ingested_at || r.reported_at);
    const diffMin = (now.getTime() - d.getTime()) / (1000 * 60);

    let passesTime = true;
    if (timeFilter === 'JUST_INGESTED') passesTime = diffMin <= 15;
    else if (timeFilter === 'LAST_1H') passesTime = diffMin <= 60;
    else if (timeFilter === 'TODAY') passesTime = d.toDateString() === now.toDateString();

    let passesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      passesSearch =
        r.id.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.event_category.toLowerCase().includes(q) ||
        r.source_id.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q);
    }

    return passesTime && passesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.ingested_at || a.reported_at).getTime();
    const dateB = new Date(b.ingested_at || b.reported_at).getTime();
    return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Platform Administration & Ingestion Governance
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              ADMIN CONTROL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit user permissions, inspect real-time report ingestion timestamps, and classify telemetry streams by date & time.
          </p>
        </div>
        <button
          onClick={fetchIngestedReports}
          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
          <span>Refresh Ingested Feed</span>
        </button>
      </div>

      {/* SECTION 1: INGESTION TIME CLASSIFICATION & TELEMETRY AUDIT */}
      <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Report Ingestion Time & Date Classification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reports categorized by exact ingestion timestamp, relative elapsed time, and time-window classifications.
            </p>
          </div>
          <div className="text-xs font-mono text-sky-300 bg-sky-950/60 border border-sky-800/60 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Current Time: {formatIngestionDate(new Date())}</span>
          </div>
        </div>

        {/* Time Bucket Classification Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setTimeFilter('JUST_INGESTED')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              timeFilter === 'JUST_INGESTED'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center justify-between">
              <span>⚡ Just Ingested</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-1">
              {justIngestedCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Within last 15 mins</div>
          </div>

          <div
            onClick={() => setTimeFilter('LAST_1H')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              timeFilter === 'LAST_1H'
                ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] text-sky-400 uppercase font-bold flex items-center justify-between">
              <span>🕒 Last 1 Hour</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-sky-300 font-mono mt-1">
              {last1hCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ingested within 60 mins</div>
          </div>

          <div
            onClick={() => setTimeFilter('TODAY')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              timeFilter === 'TODAY'
                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] text-indigo-400 uppercase font-bold flex items-center justify-between">
              <span>📅 Ingested Today</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-indigo-300 font-mono mt-1">
              {todayCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Same calendar date</div>
          </div>

          <div
            onClick={() => setTimeFilter('ALL')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              timeFilter === 'ALL'
                ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] text-purple-400 uppercase font-bold flex items-center justify-between">
              <span>📜 Total Ingestion Log</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-purple-300 font-mono mt-1">
              {reports.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">All ingested records</div>
          </div>
        </div>

        {/* Filter and Search Bar for Reports */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by ID, city, state, or weather source..."
              className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Filter: All Time</option>
              <option value="JUST_INGESTED">Filter: Just Ingested (&lt; 15 mins)</option>
              <option value="LAST_1H">Filter: Last 1 Hour</option>
              <option value="TODAY">Filter: Ingested Today</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="NEWEST">Sort: Ingested Date (Newest First)</option>
              <option value="OLDEST">Sort: Ingested Date (Oldest First)</option>
            </select>
          </div>
        </div>

        {/* Ingested Reports Table with Exact Date & Time */}
        <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Report ID & Source</th>
                <th className="py-3 px-4">Weather Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Exact Ingestion Date & Time</th>
                <th className="py-3 px-4">Time Elapsed</th>
                <th className="py-3 px-4">Time Classification</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loadingReports ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                    Loading ingested telemetry reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No reports match the selected date & time criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const classification = getTimeClassification(report.ingested_at || report.reported_at);
                  const formattedDate = formatIngestionDate(report.ingested_at || report.reported_at);
                  const timeAgo = getTimeAgo(report.ingested_at || report.reported_at);

                  return (
                    <tr key={report.id} className="hover:bg-[#18233a] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-sky-300">{report.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{report.source_id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{report.event_category}</div>
                        <span className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          report.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                          report.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                          report.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-sky-500/20 text-sky-300'
                        }`}>
                          {report.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{report.city}, {report.state}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                        {timeAgo}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${classification.badgeClass}`}>
                          {classification.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          report.verification_status === 'VERIFIED'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : report.verification_status === 'PENDING'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {report.verification_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: USER ACCESS & ROLE APPROVAL MANAGEMENT */}
      <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Registered Duty Officers & Authorities ({users.length})
          </span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
              <th className="py-3 px-4">Officer Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Department / Organization</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#18233a] transition-colors">
                <td className="py-3 px-4 font-bold text-slate-200">{u.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : u.role === 'ANALYST'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : u.role === 'VERIFIER'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{u.dept}</td>
                <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    u.status === 'ACTIVE'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : u.status === 'PENDING'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                  {u.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-400/20 rounded transition-colors"
                        title="Approve User"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        className="p-1 text-rose-400 hover:bg-rose-400/20 rounded transition-colors"
                        title="Reject User"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {u.status !== 'PENDING' && (
                    <span className="text-slate-500 italic text-[10px]">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            toastMsg.type === 'loading'
              ? 'bg-indigo-900/80 border-indigo-500/50 text-indigo-100'
              : toastMsg.type === 'success'
              ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-900/80 border-rose-500/50 text-rose-100'
          }`}>
            {toastMsg.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
