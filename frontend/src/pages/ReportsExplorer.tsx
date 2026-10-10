import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Camera,
  Video,
  ExternalLink,
  RefreshCw,
  SendHorizontal,
  Check,
  Flag,
  Sparkles,
  Cpu,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  SlidersHorizontal,
  RotateCcw,
  CloudRain
} from 'lucide-react';
import { getReports, acceptReport, markReportSuspicious, autoGovernReports } from '../services/api';
import { WeatherReport } from '../types';
import { formatIngestionDate, getTimeAgo } from '../utils/dateFormatter';

// Helper for source badge aesthetics and readable labels
export const getSourceMeta = (sourceId: string) => {
  const s = sourceId?.toUpperCase() || '';
  if (s.includes('IMD')) {
    return { label: 'IMD Govt', bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' };
  }
  if (s.includes('OPENWEATHER')) {
    return { label: 'OpenWeather', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' };
  }
  if (s.includes('OPEN_METEO') || s.includes('METEO')) {
    return { label: 'Open-Meteo', bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' };
  }
  if (s.includes('WEATHERAPI')) {
    return { label: 'WeatherAPI', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' };
  }
  if (s.includes('GOVT')) {
    return { label: 'Govt Weather', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' };
  }
  if (s.includes('CITIZEN')) {
    return { label: 'Citizen Portal', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' };
  }
  if (s.includes('TWITTER') || s.includes('SOCIAL')) {
    return { label: 'Twitter / Social', bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' };
  }
  if (s.includes('PUBLIC')) {
    return { label: 'Public Dataset', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' };
  }
  if (s.includes('SIMULATOR')) {
    return { label: 'Simulator', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' };
  }
  return { label: sourceId || 'Unknown Source', bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' };
};

// Calculate 5-Factor Scoring details for a report
const get5FactorBreakdown = (report: WeatherReport) => {
  const sourceWeights: Record<string, number> = {
    'IMD_OPEN_DATA': 0.95,
    'IMD_API': 0.95,
    'GOVT_WEATHER_API': 0.90,
    'LIVE_OPENWEATHER': 0.88,
    'LIVE_OPEN_METEO': 0.88,
    'LIVE_WEATHERAPI': 0.85,
    'WEATHER_API': 0.85,
    'CITIZEN_PORTAL': 0.70,
    'TWITTER_FEED': 0.65,
    'SOCIAL_MEDIA': 0.60,
    'PUBLIC_DATASET': 0.80,
    'SIMULATOR': 0.85
  };
  const srcWeight = sourceWeights[report.source_id?.toUpperCase()] || 0.75;
  const sourcePoints = Number((srcWeight * 35.0).toFixed(1));

  const aiConf = report.confidence || 0.85;
  const aiPoints = Number((aiConf * 25.0).toFixed(1));

  const hasMedia = Boolean(report.media && report.media.length > 0);
  const mediaPoints = hasMedia ? 15.0 : 5.0;

  const hasGps = Boolean(report.latitude && report.longitude);
  const gpsPoints = hasGps ? 10.0 : 3.0;

  let corrobPoints = 5.0;
  if (report.trust_score >= 85) corrobPoints = 15.0;
  else if (report.trust_score >= 60) corrobPoints = 10.0;

  return {
    sourcePoints,
    aiPoints,
    mediaPoints,
    gpsPoints,
    corrobPoints,
    modelName: report.ai_model_name || 'WeatherPulse-Ensemble-v1',
    confidencePct: Math.round(aiConf * 100)
  };
};

export const ReportsExplorer: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [isAutoGoverning, setIsAutoGoverning] = useState<boolean>(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL_GOVERNED' | 'ACCEPTED' | 'SUSPICIOUS' | 'ACCEPTED_HIGH' | 'ACCEPTED_STANDARD' | 'ALL'>('ALL_GOVERNED');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'JUST_INGESTED' | 'LAST_1H' | 'TODAY'>('ALL');
  const [mediaOnlyFilter, setMediaOnlyFilter] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'TRUST_DESC' | 'TRUST_ASC'>('NEWEST');

  // Fetch all reports from all sources without restricting to Citizen Portal
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Query up to 300 reports from all sources
      const data = await getReports({
        limit: 300,
        search: search.trim() ? search.trim() : undefined,
      });
      setReports(data);
    } catch (err) {
      console.error('Error loading reports in ReportsExplorer:', err);
      setToastMsg({ text: 'Failed to sync reports from backend telemetry', type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports();
    }, 15000); // 15-second live telemetry refresh
    return () => clearInterval(interval);
  }, []);

  // Distinct sources present in the fetched dataset
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.source_id) set.add(r.source_id);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Distinct categories present
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.event_category) set.add(r.event_category);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Handle single accept action
  const handleAcceptReport = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingReportId(reportId);
    setToastMsg({ text: `Marking report ${reportId} as ACCEPTED...`, type: 'loading' });
    try {
      const res = await acceptReport(reportId);
      setReports(prev => prev.map(r => r.id === reportId ? {
        ...r,
        verification_status: 'ACCEPTED',
        trust_score: res.trust_score || Math.max(r.trust_score, 90)
      } : r));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? {
          ...prev,
          verification_status: 'ACCEPTED',
          trust_score: res.trust_score || Math.max(prev.trust_score, 90)
        } : null);
      }
      setToastMsg({ text: `✅ Report ${reportId} accepted!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToastMsg({ text: `Error accepting report ${reportId}`, type: 'error' });
    } finally {
      setProcessingReportId(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Handle single mark suspicious action
  const handleMarkSuspicious = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingReportId(reportId);
    setToastMsg({ text: `Flagging report ${reportId} as SUSPICIOUS (< 40)...`, type: 'loading' });
    try {
      const res = await markReportSuspicious(reportId);
      setReports(prev => prev.map(r => r.id === reportId ? {
        ...r,
        verification_status: 'SUSPICIOUS',
        trust_score: res.trust_score || Math.min(r.trust_score, 35)
      } : r));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? {
          ...prev,
          verification_status: 'SUSPICIOUS',
          trust_score: res.trust_score || Math.min(prev.trust_score, 35)
        } : null);
      }
      setToastMsg({ text: `⚠️ Report ${reportId} marked SUSPICIOUS!`, type: 'error' });
    } catch (err) {
      console.error(err);
      setToastMsg({ text: `Error flagging report ${reportId}`, type: 'error' });
    } finally {
      setProcessingReportId(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Batch auto-govern action
  const handleAutoGovern = async () => {
    setIsAutoGoverning(true);
    setToastMsg({ text: 'Governing feed: Classifying score ≥ 40 Accepted & score < 40 Suspicious...', type: 'loading' });
    try {
      const res = await autoGovernReports({ good_threshold: 40, suspicious_threshold: 40 });
      await fetchReports();
      setToastMsg({
        text: `⚡ Complete! Marked ${res.accepted_count} Accepted & ${res.suspicious_count} Suspicious.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToastMsg({ text: 'Auto-governance failed', type: 'error' });
    } finally {
      setIsAutoGoverning(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('ALL_GOVERNED');
    setSourceFilter('ALL');
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setTimeFilter('ALL');
    setMediaOnlyFilter(false);
    setSearch('');
    setSortOrder('NEWEST');
  };

  // Check if any non-default filter is active
  const hasActiveFilters = statusFilter !== 'ALL_GOVERNED' ||
    sourceFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    timeFilter !== 'ALL' ||
    mediaOnlyFilter ||
    search.trim() !== '' ||
    sortOrder !== 'NEWEST';

  // Metrics across all loaded reports
  const totalReportsCount = reports.length;
  const acceptedTotalCount = reports.filter(r =>
    r.trust_score >= 40 ||
    r.verification_status === 'ACCEPTED' ||
    r.verification_status === 'VERIFIED'
  ).length;

  const suspiciousTotalCount = reports.filter(r =>
    r.trust_score < 40 ||
    r.verification_status === 'SUSPICIOUS'
  ).length;

  const withMediaTotalCount = reports.filter(r => r.media && r.media.length > 0).length;

  // Filter and sort the reports stream
  const displayedReports = useMemo(() => {
    return reports.filter(r => {
      const isAccepted = r.trust_score >= 40 || r.verification_status === 'ACCEPTED' || r.verification_status === 'VERIFIED';
      const isSuspicious = r.trust_score < 40 || r.verification_status === 'SUSPICIOUS';

      // 1. Status Filter: Suspicious and Accepted
      let passesStatus = true;
      if (statusFilter === 'ALL_GOVERNED') {
        passesStatus = isAccepted || isSuspicious;
      } else if (statusFilter === 'ACCEPTED') {
        passesStatus = isAccepted;
      } else if (statusFilter === 'SUSPICIOUS') {
        passesStatus = isSuspicious;
      } else if (statusFilter === 'ACCEPTED_HIGH') {
        passesStatus = r.trust_score >= 75 && r.verification_status !== 'SUSPICIOUS';
      } else if (statusFilter === 'ACCEPTED_STANDARD') {
        passesStatus = (r.trust_score >= 40 && r.trust_score < 75) && r.verification_status !== 'SUSPICIOUS';
      } else if (statusFilter === 'ALL') {
        passesStatus = true;
      }

      // 2. Source Filter (Across Various Sources)
      let passesSource = true;
      if (sourceFilter !== 'ALL') {
        passesSource = r.source_id?.toUpperCase() === sourceFilter.toUpperCase();
      }

      // 3. Category Filter
      let passesCategory = true;
      if (categoryFilter !== 'ALL') {
        passesCategory = r.event_category?.toLowerCase() === categoryFilter.toLowerCase();
      }

      // 4. Severity Filter
      let passesSeverity = true;
      if (severityFilter !== 'ALL') {
        passesSeverity = r.severity?.toUpperCase() === severityFilter.toUpperCase();
      }

      // 5. Time Filter
      let passesTime = true;
      const d = new Date(r.ingested_at || r.reported_at);
      const diffMin = (new Date().getTime() - d.getTime()) / (1000 * 60);
      if (timeFilter === 'JUST_INGESTED') passesTime = diffMin <= 15;
      else if (timeFilter === 'LAST_1H') passesTime = diffMin <= 60;
      else if (timeFilter === 'TODAY') passesTime = d.toDateString() === new Date().toDateString();

      // 6. Media Filter
      let passesMedia = true;
      if (mediaOnlyFilter) {
        passesMedia = Boolean(r.media && r.media.length > 0);
      }

      // 7. Search Filter
      let passesSearch = true;
      if (search.trim()) {
        const q = search.toLowerCase();
        passesSearch =
          r.id.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          r.event_category.toLowerCase().includes(q) ||
          r.source_id.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q);
      }

      return passesStatus && passesSource && passesCategory && passesSeverity && passesTime && passesMedia && passesSearch;
    }).sort((a, b) => {
      if (sortOrder === 'TRUST_DESC') {
        return (b.trust_score || 0) - (a.trust_score || 0);
      }
      if (sortOrder === 'TRUST_ASC') {
        return (a.trust_score || 0) - (b.trust_score || 0);
      }
      const dateA = new Date(a.ingested_at || a.reported_at).getTime();
      const dateB = new Date(b.ingested_at || b.reported_at).getTime();
      return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });
  }, [reports, statusFilter, sourceFilter, categoryFilter, severityFilter, timeFilter, mediaOnlyFilter, search, sortOrder]);

  // Export current filtered dataset to CSV
  const exportFilteredCSV = () => {
    if (displayedReports.length === 0) {
      setToastMsg({ text: 'No reports to export in current filter view', type: 'error' });
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    const headers = [
      'Report ID',
      'Source ID',
      'Weather Event Category',
      'Severity',
      'Status',
      'Trust Score',
      'City',
      'District',
      'State',
      'Latitude',
      'Longitude',
      'Reported Time',
      'Ingested Time',
      'Media Attached',
      'Telemetry Text'
    ];

    const rows = displayedReports.map(r => [
      `"${r.id}"`,
      `"${r.source_id}"`,
      `"${r.event_category}"`,
      `"${r.severity}"`,
      `"${r.verification_status}"`,
      r.trust_score,
      `"${r.city}"`,
      `"${r.district || ''}"`,
      `"${r.state}"`,
      r.latitude,
      r.longitude,
      `"${r.reported_at}"`,
      `"${r.ingested_at || r.reported_at}"`,
      r.media ? r.media.length : 0,
      `"${(r.text || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `weatherpulse_reports_explorer_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg({ text: `✅ Exported ${displayedReports.length} reports to CSV!`, type: 'success' });
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === 'loading'
              ? 'bg-sky-950/90 text-sky-200 border-sky-500/50'
              : toastMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
          }`}
        >
          {toastMsg.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-sky-400" />}
          {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Report Explorer
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-semibold border border-sky-500/30">
              MULTI-SOURCE TELEMETRY
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {displayedReports.length} MATCHING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Comprehensive exploratory intelligence grid: View, filter, and audit weather incident reports classified as{' '}
            <strong className="text-emerald-400 font-semibold">Accepted</strong> (Score ≥ 40) and{' '}
            <strong className="text-rose-400 font-semibold">Suspicious</strong> (Score &lt; 40) ingested across government, open data, crowdsourced citizen, and social feeds.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleAutoGovern}
            disabled={isAutoGoverning}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
            title="Evaluate score thresholds across entire feed"
          >
            {isAutoGoverning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-yellow-300" />}
            <span>Auto-Govern Feed</span>
          </button>

          <button
            onClick={() => fetchReports()}
            className="px-3 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] hover:border-sky-500/50 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
            title="Refresh reports from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Feed</span>
          </button>

          <button
            onClick={exportFilteredCSV}
            className="px-3 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Export filtered reports to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV ({displayedReports.length})</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0e1626] border border-[#1e293b] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-sky-600/30 text-sky-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-sky-600/30 text-sky-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: All Governed (Accepted + Suspicious) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ALL_GOVERNED' ? 'ALL' : 'ALL_GOVERNED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ALL_GOVERNED'
              ? 'bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/50'
              : 'bg-[#121b2d] border-[#1e293b] hover:border-sky-500/50'
          }`}
        >
          <div className="text-[11px] text-sky-400 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Governed Telemetry
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              Accepted + Suspicious
            </span>
          </div>
          <div className="text-2xl font-bold text-sky-200 font-mono mt-2">
            {acceptedTotalCount + suspiciousTotalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Total classified reports</span>
            <span className="text-sky-400 font-mono">
              {totalReportsCount > 0 ? Math.round(((acceptedTotalCount + suspiciousTotalCount) / totalReportsCount) * 100) : 0}% of feed
            </span>
          </div>
        </div>

        {/* Card 2: Accepted Reports (Score >= 40) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? 'ALL' : 'ACCEPTED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ACCEPTED'
              ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50'
              : 'bg-[#121b2d] border-[#1e293b] hover:border-emerald-500/50'
          }`}
        >
          <div className="text-[11px] text-emerald-400 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Accepted Reports
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Score ≥ 40
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono mt-2">
            {acceptedTotalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Authoritative & validated</span>
            <span className="text-emerald-400 font-mono">
              {totalReportsCount > 0 ? Math.round((acceptedTotalCount / totalReportsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Suspicious Reports (Score < 40) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'SUSPICIOUS' ? 'ALL' : 'SUSPICIOUS')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'SUSPICIOUS'
              ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50'
              : 'bg-[#121b2d] border-[#1e293b] hover:border-rose-500/50'
          }`}
        >
          <div className="text-[11px] text-rose-400 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Suspicious Reports
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              Score &lt; 40
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono mt-2">
            {suspiciousTotalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Flagged for low trust/anomalies</span>
            <span className="text-rose-400 font-mono">
              {totalReportsCount > 0 ? Math.round((suspiciousTotalCount / totalReportsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Various Active Sources */}
        <div className="p-3.5 rounded-xl border bg-[#121b2d] border-[#1e293b]">
          <div className="text-[11px] text-purple-400 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4" /> Active Data Sources
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              Multi-Source
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono mt-2">
            {availableSources.length} Sources
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>IMD, APIs, Citizen, Social</span>
            <span className="text-purple-400 font-mono">{withMediaTotalCount} with media</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b] space-y-3 shadow-xl">
        {/* Row 1: Search & Core Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports across ID, text, city, state, source, or event category..."
              className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter (Suspicious and Accepted) */}
            <div className="flex items-center gap-1.5 bg-[#0e1626] border border-[#1e293b] rounded-lg px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL_GOVERNED" className="bg-[#0e1626]">Status: Accepted + Suspicious ({acceptedTotalCount + suspiciousTotalCount})</option>
                <option value="ACCEPTED" className="bg-[#0e1626]">✅ Accepted Only (Score ≥ 40) ({acceptedTotalCount})</option>
                <option value="SUSPICIOUS" className="bg-[#0e1626]">⚠️ Suspicious Only (Score &lt; 40) ({suspiciousTotalCount})</option>
                <option value="ACCEPTED_HIGH" className="bg-[#0e1626]">🌟 High Trust Accepted (≥ 75)</option>
                <option value="ACCEPTED_STANDARD" className="bg-[#0e1626]">⚡ Standard Accepted (40–74)</option>
                <option value="ALL" className="bg-[#0e1626]">All Ingested Reports ({totalReportsCount})</option>
              </select>
            </div>

            {/* Various Data Sources Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1626] border border-[#1e293b] rounded-lg px-2 py-1">
              <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0e1626]">Source: All Various Sources ({availableSources.length})</option>
                <option value="IMD_OPEN_DATA" className="bg-[#0e1626]">IMD Open Data (Govt)</option>
                <option value="IMD_API" className="bg-[#0e1626]">IMD AWS API (Govt)</option>
                <option value="GOVT_WEATHER_API" className="bg-[#0e1626]">Govt Weather API</option>
                <option value="LIVE_OPENWEATHER" className="bg-[#0e1626]">OpenWeather Live API</option>
                <option value="LIVE_OPEN_METEO" className="bg-[#0e1626]">Open-Meteo Live API</option>
                <option value="LIVE_WEATHERAPI" className="bg-[#0e1626]">WeatherAPI Live</option>
                <option value="CITIZEN_PORTAL" className="bg-[#0e1626]">Citizen Portal</option>
                <option value="TWITTER_FEED" className="bg-[#0e1626]">Twitter / Social Feeds</option>
                <option value="PUBLIC_DATASET" className="bg-[#0e1626]">Public Datasets</option>
                <option value="SIMULATOR" className="bg-[#0e1626]">Simulator Telemetry</option>
                {/* Dynamically list any other detected source */}
                {availableSources
                  .filter(s => !['IMD_OPEN_DATA', 'IMD_API', 'GOVT_WEATHER_API', 'LIVE_OPENWEATHER', 'LIVE_OPEN_METEO', 'LIVE_WEATHERAPI', 'CITIZEN_PORTAL', 'TWITTER_FEED', 'PUBLIC_DATASET', 'SIMULATOR'].includes(s.toUpperCase()))
                  .map(s => (
                    <option key={s} value={s} className="bg-[#0e1626]">{s}</option>
                  ))
                }
              </select>
            </div>

            {/* Weather Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1626] border border-[#1e293b] rounded-lg px-2 py-1">
              <CloudRain className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0e1626]">Category: All Weather Events</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0e1626]">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Filters & Sorting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-[#1e293b]/70">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Severity: All Levels</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🔵 Low</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Time: All Ingested</option>
              <option value="JUST_INGESTED">Just Ingested (≤ 15 min)</option>
              <option value="LAST_1H">Past 1 Hour</option>
              <option value="TODAY">Today Only</option>
            </select>

            {/* Media Only Button */}
            <button
              onClick={() => setMediaOnlyFilter(!mediaOnlyFilter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border whitespace-nowrap ${
                mediaOnlyFilter
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-[#0e1626] text-slate-300 border-[#1e293b] hover:border-slate-600'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>With Media Only ({withMediaTotalCount})</span>
            </button>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="TRUST_DESC">Sort: Highest Trust Score</option>
              <option value="TRUST_ASC">Sort: Lowest Trust Score</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK STATUS CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
          Quick View:
        </span>
        <button
          onClick={() => setStatusFilter('ALL_GOVERNED')}
          className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 border ${
            statusFilter === 'ALL_GOVERNED'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
              : 'bg-[#121b2d] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          All Governed ({acceptedTotalCount + suspiciousTotalCount})
        </button>
        <button
          onClick={() => setStatusFilter('ACCEPTED')}
          className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 border ${
            statusFilter === 'ACCEPTED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
              : 'bg-[#121b2d] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          Accepted Reports ({acceptedTotalCount})
        </button>
        <button
          onClick={() => setStatusFilter('SUSPICIOUS')}
          className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 border ${
            statusFilter === 'SUSPICIOUS'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
              : 'bg-[#121b2d] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          Suspicious Reports ({suspiciousTotalCount})
        </button>
        {/* Source chips */}
        {availableSources.slice(0, 5).map(src => {
          const meta = getSourceMeta(src);
          const isSelected = sourceFilter.toUpperCase() === src.toUpperCase();
          return (
            <button
              key={src}
              onClick={() => setSourceFilter(isSelected ? 'ALL' : src)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all shrink-0 border ${
                isSelected
                  ? `${meta.bg} ${meta.text} ${meta.border} font-bold ring-1 ring-sky-500/50`
                  : 'bg-[#121b2d] text-slate-400 border-[#1e293b] hover:text-slate-200'
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* FEED CONTENT */}
      {loading ? (
        <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-16 text-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-sky-400" />
          <span>Synchronizing multi-source report explorer feed...</span>
        </div>
      ) : displayedReports.length === 0 ? (
        <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-16 text-center text-slate-400 text-xs space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-200">No reports match the selected filters</div>
          <p className="max-w-md mx-auto text-slate-400">
            Try adjusting your status filter, source filter, or clear your search term to view more telemetry reports.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedReports.map((report) => {
            const isAccepted = report.trust_score >= 40 || report.verification_status === 'ACCEPTED' || report.verification_status === 'VERIFIED';
            const isSuspicious = report.trust_score < 40 || report.verification_status === 'SUSPICIOUS';
            const sourceMeta = getSourceMeta(report.source_id);
            const formattedDate = formatIngestionDate(report.ingested_at || report.reported_at);
            const timeAgo = getTimeAgo(report.ingested_at || report.reported_at);
            const isProcessing = processingReportId === report.id;

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`bg-[#121b2d] rounded-xl border p-4 flex flex-col justify-between hover:border-sky-500/60 transition-all cursor-pointer shadow-lg group relative ${
                  isSuspicious
                    ? 'border-rose-900/40 hover:shadow-rose-950/20'
                    : 'border-[#1e293b] hover:shadow-sky-950/20'
                }`}
              >
                <div>
                  {/* Top Bar: ID, Status Badge & Source */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{report.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isAccepted ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        <span>{isAccepted ? 'ACCEPTED' : 'SUSPICIOUS'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Source & Severity Tags */}
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${sourceMeta.bg} ${sourceMeta.text} ${sourceMeta.border}`}>
                      {sourceMeta.label}
                    </span>

                    <span className="text-[11px] font-bold text-slate-200">
                      {report.event_category}
                    </span>

                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      report.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : report.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : report.severity === 'MEDIUM'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {report.severity}
                    </span>

                    {report.media && report.media.length > 0 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-mono ml-auto">
                        <Camera className="w-3 h-3 text-sky-400" />
                        <span>{report.media.length} media</span>
                      </span>
                    )}
                  </div>

                  {/* Telemetry Text */}
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                    {report.text}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-2 text-[11px]">
                  {/* Trust Score Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Trust Governance Score:</span>
                      <span className={`font-mono font-bold ${
                        report.trust_score >= 75
                          ? 'text-emerald-400'
                          : report.trust_score >= 40
                          ? 'text-sky-300'
                          : 'text-rose-400'
                      }`}>
                        {report.trust_score} / 100
                      </span>
                    </div>
                    <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          report.trust_score >= 75
                            ? 'bg-emerald-400'
                            : report.trust_score >= 40
                            ? 'bg-sky-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, report.trust_score))}%` }}
                      />
                    </div>
                  </div>

                  {/* Location & Time */}
                  <div className="flex items-center justify-between text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-300 truncate max-w-[60%]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{report.city}, {report.state}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#1e293b]/60" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono text-slate-400">
                      {report.trust_score >= 75 ? 'Stream: High Trust' : report.trust_score >= 40 ? 'Stream: Standard' : 'Least Trust (< 40)'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Mark Accepted */}
                      <button
                        onClick={(e) => handleAcceptReport(report.id, e)}
                        disabled={isProcessing || isAccepted}
                        className={`p-1.5 rounded-md border text-xs transition-all ${
                          isAccepted
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-600/30 opacity-70 cursor-default'
                            : 'bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border-emerald-500/40'
                        }`}
                        title={isAccepted ? 'Already Accepted' : 'Accept Report (Score ≥ 40)'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Mark Suspicious */}
                      <button
                        onClick={(e) => handleMarkSuspicious(report.id, e)}
                        disabled={isProcessing || isSuspicious}
                        className={`p-1.5 rounded-md border text-xs transition-all ${
                          isSuspicious
                            ? 'bg-rose-950/30 text-rose-400 border-rose-600/30 opacity-70 cursor-default'
                            : 'bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border-rose-500/40'
                        }`}
                        title={isSuspicious ? 'Already Marked Suspicious' : 'Mark Suspicious (< 40)'}
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>

                      {/* View Dossier */}
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-1.5 rounded-md bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-[#2d3f5e] transition-colors"
                        title="View Full Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Report ID & Source</th>
                  <th className="py-3 px-4">Weather Event</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4 text-center">Visual Media</th>
                  <th className="py-3 px-4">Ingestion Time</th>
                  <th className="py-3 px-4">Governance Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {displayedReports.map((report) => {
                  const isAccepted = report.trust_score >= 40 || report.verification_status === 'ACCEPTED' || report.verification_status === 'VERIFIED';
                  const isSuspicious = report.trust_score < 40 || report.verification_status === 'SUSPICIOUS';
                  const sourceMeta = getSourceMeta(report.source_id);
                  const formattedDate = formatIngestionDate(report.ingested_at || report.reported_at);
                  const timeAgo = getTimeAgo(report.ingested_at || report.reported_at);
                  const isProcessing = processingReportId === report.id;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-[#18233a] transition-colors cursor-pointer"
                    >
                      {/* ID & Source */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-sky-400">{report.id}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${sourceMeta.bg} ${sourceMeta.text} ${sourceMeta.border}`}>
                          {sourceMeta.label}
                        </span>
                      </td>

                      {/* Event */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-200">{report.event_category}</div>
                        <div className="text-[11px] text-slate-400 truncate">{report.text}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{report.city}, {report.state}</span>
                        </div>
                      </td>

                      {/* Trust Score */}
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold text-xs ${
                          report.trust_score >= 75
                            ? 'text-emerald-400'
                            : report.trust_score >= 40
                            ? 'text-sky-300'
                            : 'text-rose-400'
                        }`}>
                          {report.trust_score} / 100
                        </span>
                      </td>

                      {/* Visual Media */}
                      <td className="py-3 px-4 text-center">
                        {report.media && report.media.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                            <Camera className="w-3 h-3 text-sky-400" />
                            <span>{report.media.length}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-mono">—</span>
                        )}
                      </td>

                      {/* Ingestion Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{timeAgo}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                            isAccepted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isAccepted ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          <span>{isAccepted ? 'ACCEPTED' : 'SUSPICIOUS'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleAcceptReport(report.id, e)}
                            disabled={isProcessing || isAccepted}
                            className={`p-1.5 rounded-md border text-xs transition-all ${
                              isAccepted
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-600/30 opacity-70 cursor-default'
                                : 'bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border-emerald-500/40'
                            }`}
                            title={isAccepted ? 'Already Accepted' : 'Accept Report (Score ≥ 40)'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleMarkSuspicious(report.id, e)}
                            disabled={isProcessing || isSuspicious}
                            className={`p-1.5 rounded-md border text-xs transition-all ${
                              isSuspicious
                                ? 'bg-rose-950/30 text-rose-400 border-rose-600/30 opacity-70 cursor-default'
                                : 'bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border-rose-500/40'
                            }`}
                            title={isSuspicious ? 'Already Marked Suspicious' : 'Mark Suspicious (< 40)'}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-1.5 rounded-md bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-[#2d3f5e] transition-colors"
                            title="View Full Dossier"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED REPORT DOSSIER MODAL */}
      {selectedReport && (() => {
        const factors = get5FactorBreakdown(selectedReport);
        const isAccepted = selectedReport.trust_score >= 40 || selectedReport.verification_status === 'ACCEPTED' || selectedReport.verification_status === 'VERIFIED';
        const isSuspicious = selectedReport.trust_score < 40 || selectedReport.verification_status === 'SUSPICIOUS';
        const sourceMeta = getSourceMeta(selectedReport.source_id);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121b2d] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{selectedReport.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${sourceMeta.bg} ${sourceMeta.text} ${sourceMeta.border}`}>
                      {sourceMeta.label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border ${
                        isAccepted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isAccepted ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      <span>{isAccepted ? 'ACCEPTED' : 'SUSPICIOUS'}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{selectedReport.event_category}</h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Raw Telemetry Content */}
                <div className="bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Raw Telemetry Content</div>
                  <div className="text-slate-200 leading-relaxed font-sans">{selectedReport.text}</div>
                </div>

                {/* 5-Factor Deterministic Trust Scoring Breakdown */}
                <div className="bg-[#0b1220] p-4 rounded-xl border border-sky-900/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-100 uppercase text-[11px] tracking-wider">
                        Deterministic 5-Factor Trust Scoring Breakdown
                      </span>
                    </div>
                    <span className={`font-mono font-bold text-xs ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Total Score: {selectedReport.trust_score}/100 ({isAccepted ? 'Accepted' : 'Suspicious'})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Factor 1: Source Reliability */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 1: Source Credibility ({selectedReport.source_id})</span>
                        <span className="font-mono text-sky-300 font-bold">{factors.sourcePoints} / 35.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.sourcePoints / 35.0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Factor 2: Pre-Trained Model Confidence */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 2: AI Pre-Trained Model ({factors.modelName})</span>
                        <span className="font-mono text-emerald-300 font-bold">{factors.aiPoints} / 25.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.aiPoints / 25.0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Factor 3: Media Evidence */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 3: Attached Visual Evidence</span>
                        <span className="font-mono text-amber-300 font-bold">{factors.mediaPoints} / 15.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.mediaPoints / 15.0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Factor 4: GPS Precision */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 4: Geospatial GPS Telemetry</span>
                        <span className="font-mono text-purple-300 font-bold">{factors.gpsPoints} / 10.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.gpsPoints / 10.0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Factor 5: Corroboration */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 5: Cross-Cluster Corroboration</span>
                        <span className="font-mono text-teal-300 font-bold">{factors.corrobPoints} / 15.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.corrobPoints / 15.0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attached Visual Media Gallery */}
                {selectedReport.media && selectedReport.media.length > 0 && (
                  <div className="bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b] space-y-2">
                    <div className="text-[10px] text-sky-400 uppercase font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                        Attached Visual Evidence ({selectedReport.media.length})
                      </span>
                      <span className="text-slate-400 font-mono text-[9px]">Field Capture</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {selectedReport.media.map((item, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-[#1e293b] bg-black/60 group/media relative">
                          {item.media_type === 'VIDEO' || item.media_url.startsWith('data:video') || item.media_url.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                            <div className="space-y-1">
                              <video
                                src={item.media_url}
                                controls
                                className="w-full h-44 object-cover rounded-t-lg bg-black"
                              />
                              <div className="p-1.5 flex items-center justify-between text-[10px] text-slate-300 font-sans bg-[#0b111e]">
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Video className="w-3 h-3" /> Video Clip
                                </span>
                                <a
                                  href={item.media_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-400 hover:underline flex items-center gap-0.5"
                                >
                                  Full view
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <a
                                href={item.media_url}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden relative cursor-pointer"
                              >
                                <img
                                  src={item.media_url}
                                  alt={item.caption || "Citizen weather photo"}
                                  className="w-full h-44 object-cover group-hover/media:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-white flex items-center gap-1">
                                  <ExternalLink className="w-2.5 h-2.5" /> Open
                                </div>
                              </a>
                              {item.caption && (
                                <p className="p-1.5 text-[10px] text-slate-300 font-sans truncate bg-[#0b111e]">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location & Metadata Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Location Coordinates</div>
                    <div className="font-bold text-slate-200 mt-0.5">{selectedReport.city}, {selectedReport.state}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Lat: {selectedReport.latitude ? selectedReport.latitude.toFixed(4) : 'N/A'}, Lon: {selectedReport.longitude ? selectedReport.longitude.toFixed(4) : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Ingestion & Telemetry</div>
                    <div className="font-mono text-slate-200 mt-0.5">{formatIngestionDate(selectedReport.ingested_at || selectedReport.reported_at)}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{getTimeAgo(selectedReport.ingested_at || selectedReport.reported_at)}</div>
                  </div>
                </div>

                {/* AI Reasoning */}
                {selectedReport.ai_reasoning && (
                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Pre-Trained AI Reasoning</div>
                    <p className="text-slate-300 italic">{selectedReport.ai_reasoning}</p>
                  </div>
                )}

                {/* Raw Payload Preview (if present) */}
                {selectedReport.raw_payload && (
                  <details className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <summary className="text-[10px] text-slate-400 uppercase font-semibold cursor-pointer">
                      View Raw Payload JSON
                    </summary>
                    <pre className="mt-2 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap bg-black/40 p-2 rounded">
                      {typeof selectedReport.raw_payload === 'string'
                        ? selectedReport.raw_payload
                        : JSON.stringify(selectedReport.raw_payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Modal Footer with Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptReport(selectedReport.id)}
                    disabled={isAccepted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isAccepted
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 opacity-70 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? 'Accepted' : 'Mark Accepted (Score ≥ 40)'}</span>
                  </button>

                  <button
                    onClick={() => handleMarkSuspicious(selectedReport.id)}
                    disabled={isSuspicious}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSuspicious
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30 opacity-70 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isSuspicious ? 'Flagged Suspicious' : 'Mark Suspicious (< 40)'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
