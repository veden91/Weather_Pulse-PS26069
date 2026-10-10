import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { getReports } from '../services/api';
import { WeatherReport } from '../types';
import {
  CloudRain,
  Search,
  MapPin,
  Eye,
  ShieldCheck,
  Wind,
  Thermometer,
  Droplets,
  CheckCircle2
} from 'lucide-react';

// Category icon helper
const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('rain') || cat.includes('flood')) return <Droplets className="w-4 h-4" />;
  if (cat.includes('heat') || cat.includes('wave')) return <Thermometer className="w-4 h-4" />;
  if (cat.includes('cyclone') || cat.includes('wind') || cat.includes('storm')) return <Wind className="w-4 h-4" />;
  return <CloudRain className="w-4 h-4" />;
};

export const PublicEventExplorer: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchVerifiedReports = () => {
    setLoading(true);
    // Only fetch reports that have been verified by an admin
    getReports({ verification_status: 'VERIFIED', limit: 100 })
      .then((data) => {
        if (data && data.length > 0) {
          setReports(data);
        }
      })
      .catch((err) => console.warn('Failed to load verified reports:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifiedReports();
    // Auto-refresh every 60 seconds to pick up newly verified reports
    const interval = setInterval(fetchVerifiedReports, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter((r) => {
    // Double-check on client side: only show VERIFIED reports
    if (r.verification_status !== 'VERIFIED') return false;
    const matchesSearch = !searchTerm ||
      (r.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.state || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.event_category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || r.event_category === categoryFilter;
    const matchesSeverity = !severityFilter || r.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'MEDIUM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Top Header */}
      <PublicHeader activePage="events" />

      {/* Header Offset */}
      <div className="h-28 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Feature Banner */}
        <div className="bg-[#0e172a] border border-[#1e293b] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Admin-Verified Live Events</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
                Live Weather Events
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Only events that have been reviewed and verified by our admin team are shown here. All reports are cross-validated before going live.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {filteredReports.length} VERIFIED EVENTS
              </span>
              <button
                onClick={fetchVerifiedReports}
                title="Refresh"
                className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by city, state or event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Categories</option>
              <option value="Heavy Rainfall">Heavy Rainfall</option>
              <option value="Thunderstorm">Thunderstorm</option>
              <option value="Cyclone">Cyclone</option>
              <option value="Flash Flood">Flash Flood</option>
              <option value="Dense Fog">Dense Fog</option>
              <option value="Heatwave">Heatwave</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading verified events...</p>
          </div>
        )}

        {/* Empty State — no verified reports yet */}
        {!loading && filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-semibold text-lg mb-2">No Verified Events Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Events appear here once an admin reviews and verifies them.
              {searchTerm || categoryFilter || severityFilter ? ' Try clearing your filters.' : ' Check back soon.'}
            </p>
            {(searchTerm || categoryFilter || severityFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter(''); setSeverityFilter(''); }}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs hover:bg-sky-500/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Verified Reports Grid */}
        {!loading && filteredReports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-[#0d1627] border border-[#1e293b] hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-emerald-500/10 group"
              >
                <div>
                  {/* Category + Severity Row */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                      {getCategoryIcon(report.event_category)}
                      <span>{report.event_category || 'Weather Event'}</span>
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${getSeverityBadge(report.severity)}` }>
                      {report.severity}
                    </span>
                  </div>

                  {/* Admin Verified Badge */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Verified by Admin</span>
                  </div>

                  {/* Report Text */}
                  <p className="text-sm text-slate-100 font-medium group-hover:text-sky-300 transition-colors line-clamp-2 mb-2">
                    {report.text || `${report.event_category} reported in ${report.city}, ${report.state}`}
                  </p>

                  {/* Trust Score */}
                  {report.trust_score != null && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all"
                          style={{ width: `${Math.min(report.trust_score, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{report.trust_score}% trust</span>
                    </div>
                  )}
                </div>

                {/* Footer Row */}
                <div className="mt-5 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{[report.city, report.state].filter(Boolean).join(', ') || 'India'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {report.reported_at ? new Date(report.reported_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                    </span>
                    <button
                      onClick={() => navigate('/map')}
                      className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                      title="View on Map"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0a0f1a] py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} WeatherPulse Intelligence Grid. All rights reserved.</p>
      </footer>
    </div>
  );
};
