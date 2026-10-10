import React, { useEffect, useState, useMemo } from 'react';
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
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  AlertTriangle
} from 'lucide-react';

// Category icon helper
const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('rain') || cat.includes('flood')) return <Droplets className="w-4 h-4 text-sky-400" />;
  if (cat.includes('heat') || cat.includes('wave')) return <Thermometer className="w-4 h-4 text-amber-400" />;
  if (cat.includes('cyclone') || cat.includes('wind') || cat.includes('storm')) return <Wind className="w-4 h-4 text-cyan-400" />;
  return <CloudRain className="w-4 h-4 text-sky-400" />;
};

// Check if report qualifies as verified
const isVerifiedReport = (r: WeatherReport): boolean => {
  return (
    r.verification_status === 'VERIFIED' ||
    r.verification_status === 'ACCEPTED' ||
    (r.trust_score != null && r.trust_score >= 40)
  );
};

export const PublicEventExplorer: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'trust_desc' | 'severity'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const fetchVerifiedReports = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      // Fetch up to 1000 reports with VERIFIED / ACCEPTED status
      const data = await getReports({ verification_status: 'VERIFIED', limit: 1000 });
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.warn('Failed to load verified reports:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVerifiedReports();
    // Auto-refresh every 30 seconds to pick up newly verified reports live
    const interval = setInterval(() => fetchVerifiedReports(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Distinct Categories and States from verified dataset
  const { availableCategories, availableStates } = useMemo(() => {
    const cats = new Set<string>();
    const states = new Set<string>();
    reports.forEach((r) => {
      if (isVerifiedReport(r)) {
        if (r.event_category) cats.add(r.event_category);
        if (r.state) states.add(r.state);
      }
    });
    return {
      availableCategories: Array.from(cats).sort(),
      availableStates: Array.from(states).sort()
    };
  }, [reports]);

  // Client-side filtering & sorting
  const filteredReports = useMemo(() => {
    const list = reports.filter((r) => {
      if (!isVerifiedReport(r)) return false;

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.text || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q) ||
        (r.event_category || '').toLowerCase().includes(q);

      const matchesCategory = !categoryFilter || r.event_category === categoryFilter;
      const matchesSeverity = !severityFilter || r.severity?.toUpperCase() === severityFilter.toUpperCase();
      const matchesState = !stateFilter || r.state === stateFilter;

      return matchesSearch && matchesCategory && matchesSeverity && matchesState;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'trust_desc') {
        return (b.trust_score || 0) - (a.trust_score || 0);
      }
      if (sortBy === 'severity') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[b.severity?.toUpperCase() || ''] || 0) - (order[a.severity?.toUpperCase() || ''] || 0);
      }
      // default: newest first
      const dateA = a.reported_at ? new Date(a.reported_at).getTime() : 0;
      const dateB = b.reported_at ? new Date(b.reported_at).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [reports, searchTerm, categoryFilter, severityFilter, stateFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, severityFilter, stateFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const hasActiveFilters = Boolean(searchTerm || categoryFilter || severityFilter || stateFilter || sortBy !== 'newest');

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSeverityFilter('');
    setStateFilter('');
    setSortBy('newest');
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
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
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b14]/80">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <PublicHeader activePage="events" />

      {/* Header Offset */}
      <div className="h-28 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 relative z-10">
        {/* Feature Banner */}
        <div className="bg-[#0e172a]/95 border border-[#1e293b] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Meteorological Feed</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                Live Weather Events
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Displaying all verified weather reports and ground observations authenticated across IMD, regional sensors, and verified citizen telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{filteredReports.length} VERIFIED REPORTS</span>
              </span>
              <button
                onClick={() => fetchVerifiedReports(true)}
                disabled={isRefreshing || loading}
                title="Refresh live reports"
                className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by city, state, event type, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All States ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Bar */}
          <div className="mt-4 pt-3 border-t border-[#1e293b]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Sort:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'newest' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'hover:text-slate-200'}`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('trust_desc')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'trust_desc' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'hover:text-slate-200'}`}
              >
                Highest Trust
              </button>
              <button
                onClick={() => setSortBy('severity')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === 'severity' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'hover:text-slate-200'}`}
              >
                Severity
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs transition-colors border border-slate-700"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading verified reports...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#0d1627]/60 rounded-3xl border border-[#1e293b] p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-semibold text-lg mb-2">No Matching Verified Reports</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              {hasActiveFilters
                ? 'No reports match your active search or filters. Try adjusting your query.'
                : 'Verified reports will appear here as ground-truth observations are authenticated.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs hover:bg-sky-500/20 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Verified Reports Grid */}
        {!loading && filteredReports.length > 0 && (
          <>
            {/* Results Counter & Pagination Summary */}
            <div className="flex items-center justify-between mb-4 px-1 text-xs text-slate-400">
              <span>
                Showing <strong className="text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> –{' '}
                <strong className="text-slate-200">
                  {Math.min(currentPage * pageSize, filteredReports.length)}
                </strong>{' '}
                of <strong className="text-emerald-400">{filteredReports.length}</strong> verified events
              </span>
              <span>
                Page <strong className="text-slate-200">{currentPage}</strong> of{' '}
                <strong className="text-slate-200">{totalPages}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-[#0d1627] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer group"
                >
                  <div>
                    {/* Category + Severity Row */}
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
                        {getCategoryIcon(report.event_category)}
                        <span>{report.event_category || 'Weather Event'}</span>
                      </span>
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${getSeverityBadge(report.severity)}`}>
                        {report.severity || 'MEDIUM'}
                      </span>
                    </div>

                    {/* Admin Verified Badge */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Verified by Admin
                      </span>
                      {report.id && (
                        <span className="text-[10px] text-slate-500 font-mono ml-auto">
                          {report.id}
                        </span>
                      )}
                    </div>

                    {/* Report Text */}
                    <p className="text-sm text-slate-100 font-medium group-hover:text-sky-300 transition-colors line-clamp-3 mb-3 leading-relaxed">
                      {report.text || `${report.event_category} observation in ${report.city}, ${report.state}`}
                    </p>

                    {/* Trust Score Progress */}
                    {report.trust_score != null && (
                      <div className="mt-3 bg-[#070c18] p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>Trust Score</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-400">{report.trust_score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all"
                            style={{ width: `${Math.min(report.trust_score, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="mt-5 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">
                        {[report.city, report.state].filter(Boolean).join(', ') || 'India'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {report.reported_at
                          ? new Date(report.reported_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short'
                            })
                          : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/map');
                        }}
                        className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                        title="View on India Geo-Analytics"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#1e293b]">
                <div className="text-xs text-slate-400">
                  Showing page <strong className="text-slate-200">{currentPage}</strong> of{' '}
                  <strong className="text-slate-200">{totalPages}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white hover:border-sky-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-mono font-semibold transition-all ${
                            currentPage === pageNum
                              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                              : 'bg-slate-900 border border-[#1e293b] text-slate-400 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white hover:border-sky-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Report Quick Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e172a] border border-[#1e293b] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
                {getCategoryIcon(selectedReport.event_category)}
                <span>{selectedReport.event_category}</span>
              </span>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${getSeverityBadge(selectedReport.severity)}`}>
                {selectedReport.severity}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>VERIFIED</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2">
              Report Observation Details
            </h3>

            <p className="text-sm text-slate-300 bg-[#070c18] p-4 rounded-2xl border border-slate-800/80 mb-5 leading-relaxed">
              {selectedReport.text}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Location</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {[selectedReport.city, selectedReport.state].filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Trust Score</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {selectedReport.trust_score}% (Authenticated)
                </span>
              </div>
              <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Coordinates</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}
                </span>
              </div>
              <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Reported Time</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {selectedReport.reported_at ? new Date(selectedReport.reported_at).toLocaleString('en-IN') : 'Recent'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedReport(null);
                  navigate('/map');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View On Geospatial Map</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0a0f1a] py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} WeatherPulse Intelligence Grid. All rights reserved.</p>
      </footer>
    </div>
  );
};

