import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  AlertTriangle,
  Camera,
  Video,
  ExternalLink,
  X,
  Eye,
  Check,
  Flag,
  Sparkles,
  Cpu,
  BarChart2,
  Radio,
  Star,
  CheckCheck
} from 'lucide-react';
import { getReports, acceptReport, markReportSuspicious, autoGovernReports } from '../services/api';
import { WeatherReport } from '../types';
import { formatIngestionDate, getTimeAgo, getTimeClassification } from '../utils/dateFormatter';

export const AdminPanel: React.FC = () => {
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);

  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. M. Ravichandran', role: 'ADMIN', dept: 'Ministry of Earth Sciences (MoES)', username: 'admin', email: 'admin@weatherpulse.gov.in', status: 'ACTIVE' },
    { id: 2, name: 'Dr. Mrutyunjay Mohapatra', role: 'ANALYST', dept: 'India Meteorological Department (IMD)', username: 'analyst', email: 'analyst@weatherpulse.gov.in', status: 'PENDING' },
    { id: 3, name: 'Duty Verification Officer', role: 'VERIFIER', dept: 'National Weather Watch Center', username: 'verifier', email: 'verifier@imd.gov.in', status: 'PENDING' },
    { id: 4, name: 'NDRF Control Room', role: 'VIEWER', dept: 'National Disaster Response Force', username: 'ndrf_ops', email: 'ndrf@ndma.gov.in', status: 'ACTIVE' }
  ]);

  // Reports Ingestion State
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [isAutoGoverning, setIsAutoGoverning] = useState<boolean>(false);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  // Filters
  const [trustFilter, setTrustFilter] = useState<'ALL' | 'ACCEPTED_ALL' | 'ACCEPTED_HIGH' | 'ACCEPTED_STANDARD' | 'SUSPICIOUS_LOW'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'JUST_INGESTED' | 'LAST_1H' | 'TODAY'>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'WITH_MEDIA' | 'CITIZEN_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'TRUST_DESC' | 'TRUST_ASC'>('NEWEST');

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.source_id) set.add(r.source_id);
    });
    return Array.from(set).sort();
  }, [reports]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.event_category) set.add(r.event_category);
    });
    return Array.from(set).sort();
  }, [reports]);

  const fetchIngestedReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getReports({ limit: 300 });
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports for admin panel:', err);
      setToastMsg({ text: 'Failed to fetch ingested telemetry reports', type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
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

  // Action: Accept Single Report
  const handleAcceptSingleReport = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingReportId(reportId);
    setToastMsg({ text: `Accepting report ${reportId} (score ≥ 40)...`, type: 'loading' });
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
      setToastMsg({ text: `✅ Report ${reportId} marked ACCEPTED!`, type: 'success' });
    } catch (err) {
      console.error('Failed to accept report:', err);
      setToastMsg({ text: `Error accepting report ${reportId}`, type: 'error' });
    } finally {
      setProcessingReportId(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Action: Mark Single Report as Suspicious (< 40)
  const handleMarkSingleReportSuspicious = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingReportId(reportId);
    setToastMsg({ text: `Marking report ${reportId} as Suspicious (least trust < 40)...`, type: 'loading' });
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
      setToastMsg({ text: `⚠️ Report ${reportId} marked SUSPICIOUS (< 40)!`, type: 'error' });
    } catch (err) {
      console.error('Failed to mark report suspicious:', err);
      setToastMsg({ text: `Error marking report ${reportId} suspicious`, type: 'error' });
    } finally {
      setProcessingReportId(null);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Action: Batch Auto-Governance (Score >= 40 ACCEPTED, Score < 40 SUSPICIOUS)
  const handleBatchAutoGovern = async () => {
    setIsAutoGoverning(true);
    setToastMsg({ text: 'Evaluating feed: Marking reports with score ≥ 40 ACCEPTED & least trust (< 40) SUSPICIOUS...', type: 'loading' });
    try {
      const res = await autoGovernReports({ good_threshold: 40, suspicious_threshold: 40 });
      await fetchIngestedReports();
      setToastMsg({
        text: `⚡ Governance complete! Marked ${res.accepted_count} Accepted (Score ≥ 40) & ${res.suspicious_count} Suspicious (Score < 40).`,
        type: 'success'
      });
    } catch (err) {
      console.error('Auto governance failed:', err);
      setToastMsg({ text: 'Auto-governance failed to execute', type: 'error' });
    } finally {
      setIsAutoGoverning(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Calculate 5-Factor Scoring details for a report
  const get5FactorBreakdown = (report: WeatherReport) => {
    const sourceWeights: Record<string, number> = {
      'IMD_OPEN_DATA': 0.95,
      'IMD_API': 0.95,
      'GOVT_WEATHER_API': 0.90,
      'WEATHER_API': 0.85,
      'CITIZEN_PORTAL': 0.70,
      'TWITTER_FEED': 0.65,
      'SOCIAL_MEDIA': 0.60,
      'SIMULATOR': 0.85
    };
    const srcWeight = sourceWeights[report.source_id?.toUpperCase()] || 0.70;
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

  // Trust-based calculations: Any report with score >= 40 is marked Accepted
  const acceptedTotalCount = reports.filter(r =>
    r.trust_score >= 40 ||
    r.verification_status === 'ACCEPTED' ||
    r.verification_status === 'VERIFIED'
  ).length;

  const acceptedHighTrustCount = reports.filter(r =>
    r.trust_score >= 75 &&
    r.verification_status !== 'SUSPICIOUS'
  ).length;

  const acceptedStandardCount = reports.filter(r =>
    (r.trust_score >= 40 && r.trust_score < 75) &&
    r.verification_status !== 'SUSPICIOUS'
  ).length;

  const suspiciousCount = reports.filter(r =>
    r.trust_score < 40 ||
    r.verification_status === 'SUSPICIOUS'
  ).length;

  const withMediaCount = reports.filter(r => r.media && r.media.length > 0).length;

  // Filtered and Sorted Reports
  const filteredReports = reports.filter(r => {
    const d = new Date(r.ingested_at || r.reported_at);
    const diffMin = (new Date().getTime() - d.getTime()) / (1000 * 60);

    // 1. Trust & Governance Filter: No reports with score >= 40 in pending
    let passesTrust = true;
    if (trustFilter === 'ACCEPTED_ALL') {
      passesTrust = r.trust_score >= 40 || r.verification_status === 'ACCEPTED' || r.verification_status === 'VERIFIED';
    } else if (trustFilter === 'ACCEPTED_HIGH') {
      passesTrust = r.trust_score >= 75 && r.verification_status !== 'SUSPICIOUS';
    } else if (trustFilter === 'ACCEPTED_STANDARD') {
      passesTrust = (r.trust_score >= 40 && r.trust_score < 75) && r.verification_status !== 'SUSPICIOUS';
    } else if (trustFilter === 'SUSPICIOUS_LOW') {
      passesTrust = r.trust_score < 40 || r.verification_status === 'SUSPICIOUS';
    }

    // 2. Source Filter
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
    if (timeFilter === 'JUST_INGESTED') passesTime = diffMin <= 15;
    else if (timeFilter === 'LAST_1H') passesTime = diffMin <= 60;
    else if (timeFilter === 'TODAY') passesTime = d.toDateString() === new Date().toDateString();

    // 6. Evidence Filter
    let passesEvidence = true;
    if (evidenceFilter === 'WITH_MEDIA') {
      passesEvidence = Boolean(r.media && r.media.length > 0);
    } else if (evidenceFilter === 'CITIZEN_ONLY') {
      passesEvidence = r.source_id === 'CITIZEN_PORTAL';
    }

    // 7. Search Filter
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

    return passesTrust && passesSource && passesCategory && passesSeverity && passesTime && passesEvidence && passesSearch;
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
            Automated trust governance: Telemetry with score ≥ 40 is marked <strong>Accepted</strong> (separated by high trust vs standard), while score &lt; 40 is marked <strong>Suspicious</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleBatchAutoGovern}
            disabled={isAutoGoverning}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
            title="Auto-mark all reports with score ≥ 40 as Accepted, and score < 40 as Suspicious"
          >
            {isAutoGoverning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-yellow-300" />}
            <span>Auto-Govern Feed (Accept Score ≥ 40)</span>
          </button>
          <button
            onClick={fetchIngestedReports}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: REPORT EXPLORER & INGESTION GOVERNANCE */}
      <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Report Explorer & Ingestion Governance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-source telemetry explorer: Score ≥ 40 marked <strong className="text-emerald-400">Accepted</strong> (High Trust ≥ 75 and Standard streams), while score &lt; 40 marked <strong className="text-rose-400">Suspicious</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Link
              to="/reports"
              className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Open Dedicated Report Explorer</span>
            </Link>
            <div className="text-xs font-mono text-sky-300 bg-sky-950/60 border border-sky-800/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Model: WeatherPulse-Ensemble-v1 (Active)</span>
            </div>
          </div>
        </div>

        {/* Governance Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: All Accepted Telemetry (Score >= 40) */}
          <div
            onClick={() => setTrustFilter(trustFilter === 'ACCEPTED_ALL' ? 'ALL' : 'ACCEPTED_ALL')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              trustFilter === 'ACCEPTED_ALL'
                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-emerald-500/50'
            }`}
          >
            <div className="text-[11px] text-emerald-400 uppercase font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4" /> All Accepted Reports
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Score ≥ 40
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-300 font-mono mt-2">
              {acceptedTotalCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Marked Accepted for Portal</span>
              <span className="text-emerald-400 font-mono">
                {reports.length > 0 ? Math.round((acceptedTotalCount / reports.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Card 2: High Trust Accepted (Score >= 75) */}
          <div
            onClick={() => setTrustFilter(trustFilter === 'ACCEPTED_HIGH' ? 'ALL' : 'ACCEPTED_HIGH')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              trustFilter === 'ACCEPTED_HIGH'
                ? 'bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/50'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-teal-500/50'
            }`}
          >
            <div className="text-[11px] text-teal-400 uppercase font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-teal-400" /> High Trust Accepted
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                Score ≥ 75
              </span>
            </div>
            <div className="text-2xl font-bold text-teal-300 font-mono mt-2">
              {acceptedHighTrustCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Authoritative telemetry stream</span>
              <span className="text-teal-400 font-mono">
                {reports.length > 0 ? Math.round((acceptedHighTrustCount / reports.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Card 3: Standard Accepted (Score 40-74) */}
          <div
            onClick={() => setTrustFilter(trustFilter === 'ACCEPTED_STANDARD' ? 'ALL' : 'ACCEPTED_STANDARD')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              trustFilter === 'ACCEPTED_STANDARD'
                ? 'bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/50'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-sky-500/50'
            }`}
          >
            <div className="text-[11px] text-sky-400 uppercase font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> Standard Accepted
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                Score 40–74
              </span>
            </div>
            <div className="text-2xl font-bold text-sky-300 font-mono mt-2">
              {acceptedStandardCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Accepted separately in portal</span>
              <span className="text-sky-400 font-mono">
                {reports.length > 0 ? Math.round((acceptedStandardCount / reports.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Card 4: Suspicious (Score < 40) */}
          <div
            onClick={() => setTrustFilter(trustFilter === 'SUSPICIOUS_LOW' ? 'ALL' : 'SUSPICIOUS_LOW')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              trustFilter === 'SUSPICIOUS_LOW'
                ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50'
                : 'bg-[#0e1626] border-[#1e293b] hover:border-rose-500/50'
            }`}
          >
            <div className="text-[11px] text-rose-400 uppercase font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspicious (Least Trust)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                Score &lt; 40
              </span>
            </div>
            <div className="text-2xl font-bold text-rose-300 font-mono mt-2">
              {suspiciousCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Least trust anomalies flagged</span>
              <span className="text-rose-400 font-mono">
                {reports.length > 0 ? Math.round((suspiciousCount / reports.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 5-Factor Deterministic Rule Banner */}
        <div className="bg-[#0b1220] border border-[#1e293b] rounded-lg p-3 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              <strong className="text-slate-100 font-semibold">Active Ingestion Governance Policy:</strong>{' '}
              All telemetry with trust score ≥ 40 is marked <strong className="text-emerald-400">Accepted</strong> in the portal. Telemetry with least trust (&lt; 40) is marked <strong className="text-rose-400">Suspicious</strong>.
            </span>
          </div>
          <button
            onClick={handleBatchAutoGovern}
            disabled={isAutoGoverning}
            className="text-[11px] font-mono px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Zap className="w-3 h-3 text-yellow-300" />
            <span>Run Policy on Feed ({reports.length})</span>
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Trust Governance Filter */}
            <select
              value={trustFilter}
              onChange={(e) => setTrustFilter(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Reports ({reports.length})</option>
              <option value="ACCEPTED_ALL">✅ All Accepted Reports ≥ 40 ({acceptedTotalCount})</option>
              <option value="ACCEPTED_HIGH">🌟 High Trust Accepted ≥ 75 ({acceptedHighTrustCount})</option>
              <option value="ACCEPTED_STANDARD">⚡ Standard Accepted 40–74 ({acceptedStandardCount})</option>
              <option value="SUSPICIOUS_LOW">⚠️ Suspicious Reports &lt; 40 ({suspiciousCount})</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Data Sources ({availableSources.length})</option>
              <option value="IMD_OPEN_DATA">IMD Open Data (Govt)</option>
              <option value="IMD_API">IMD AWS API (Govt)</option>
              <option value="GOVT_WEATHER_API">Govt Weather API</option>
              <option value="LIVE_OPENWEATHER">OpenWeather Live API</option>
              <option value="LIVE_OPEN_METEO">Open-Meteo Live API</option>
              <option value="LIVE_WEATHERAPI">WeatherAPI Live</option>
              <option value="CITIZEN_PORTAL">Citizen Portal</option>
              <option value="TWITTER_FEED">Twitter Feed</option>
              <option value="SOCIAL_MEDIA">Social Media Feeds</option>
              <option value="PUBLIC_DATASET">Public Datasets</option>
              <option value="SIMULATOR">Simulator Telemetry</option>
              {availableSources
                .filter(s => !['IMD_OPEN_DATA', 'IMD_API', 'GOVT_WEATHER_API', 'LIVE_OPENWEATHER', 'LIVE_OPEN_METEO', 'LIVE_WEATHERAPI', 'CITIZEN_PORTAL', 'TWITTER_FEED', 'SOCIAL_MEDIA', 'PUBLIC_DATASET', 'SIMULATOR'].includes(s.toUpperCase()))
                .map(s => (
                  <option key={s} value={s}>{s}</option>
                ))
              }
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Weather Events</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🔵 Low</option>
            </select>

            {/* Evidence Filter */}
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Evidence Types</option>
              <option value="WITH_MEDIA">📷 Visual Evidence Attached ({withMediaCount})</option>
              <option value="CITIZEN_ONLY">👤 Citizen Portal Reports</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="TRUST_DESC">Sort: Highest Trust Score</option>
              <option value="TRUST_ASC">Sort: Lowest Trust Score</option>
            </select>
          </div>
        </div>

        {/* Ingested Reports Table */}
        <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Report ID & Source</th>
                <th className="py-3 px-4">Weather Event</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Trust Score & 5-Factor Gauge</th>
                <th className="py-3 px-4">Pre-Trained AI Model</th>
                <th className="py-3 px-4 text-center">Visual Evidence</th>
                <th className="py-3 px-4">Ingestion Date & Time</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loadingReports ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-mono">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                    Loading ingested telemetry reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No reports match the selected trust score or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const formattedDate = formatIngestionDate(report.ingested_at || report.reported_at);
                  const timeAgo = getTimeAgo(report.ingested_at || report.reported_at);
                  const breakdown = get5FactorBreakdown(report);

                  // Score >= 40 is Accepted; Score < 40 is Suspicious
                  const isAccepted = report.trust_score >= 40 || report.verification_status === 'ACCEPTED' || report.verification_status === 'VERIFIED';
                  const isSuspicious = report.trust_score < 40 || report.verification_status === 'SUSPICIOUS';
                  const isProcessing = processingReportId === report.id;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-[#18233a] transition-colors cursor-pointer group/row"
                    >
                      {/* 1. ID & Source */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-sky-300 group-hover/row:text-sky-200">
                          {report.id}
                        </div>
                        <span className={`inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded mt-0.5 border ${
                          report.source_id?.includes('IMD')
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : report.source_id === 'CITIZEN_PORTAL'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : report.source_id?.includes('TWITTER') || report.source_id?.includes('SOCIAL')
                            ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                            : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                        }`}>
                          {report.source_id}
                        </span>
                      </td>

                      {/* 2. Weather Event */}
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

                      {/* 3. Location */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{report.city}, {report.state}</span>
                        </div>
                      </td>

                      {/* 4. Trust Score & 5-Factor Gauge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`font-mono font-bold text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${
                            report.trust_score >= 75
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : report.trust_score >= 40
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            <span>{report.trust_score}/100</span>
                            {report.trust_score >= 75 && <span className="text-[9px] font-sans">High Trust</span>}
                            {report.trust_score >= 40 && report.trust_score < 75 && <span className="text-[9px] font-sans">Accepted</span>}
                            {report.trust_score < 40 && <span className="text-[9px] font-sans">Least Trust</span>}
                          </div>
                        </div>
                        {/* 5-Factor mini-pills */}
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono">
                          <span title={`Source: ${breakdown.sourcePoints} pts`}>Src:{breakdown.sourcePoints}</span>
                          <span>•</span>
                          <span title={`AI NLP: ${breakdown.aiPoints} pts`}>AI:{breakdown.aiPoints}</span>
                          <span>•</span>
                          <span title={`Media: ${breakdown.mediaPoints} pts`}>Med:{breakdown.mediaPoints}</span>
                        </div>
                      </td>

                      {/* 5. Pre-Trained AI Model */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-mono text-slate-200 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-emerald-400" />
                          <span>{breakdown.modelName}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {breakdown.confidencePct}% match confidence
                        </div>
                      </td>

                      {/* 6. Visual Evidence */}
                      <td className="py-3 px-4 text-center">
                        {report.media && report.media.length > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-bold transition-all shadow-sm group/btn"
                            title="View attached citizen photos and videos"
                          >
                            <Camera className="w-3 h-3 text-sky-400 group-hover/btn:scale-110 transition-transform" />
                            <span>{report.media.length} Media</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-mono">Text only</span>
                        )}
                      </td>

                      {/* 7. Exact Ingestion Date & Time */}
                      <td className="py-3 px-4 font-mono text-slate-200">
                        <div className="text-xs font-semibold">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{timeAgo}</div>
                      </td>

                      {/* 8. Governance Status: Score >= 40 is ACCEPTED */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                            isAccepted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/50'
                          }`}>
                            {isAccepted ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            <span>{isAccepted ? 'ACCEPTED' : 'SUSPICIOUS'}</span>
                          </span>
                          <div className="text-[9px] font-mono text-slate-400">
                            {report.trust_score >= 75 ? 'Stream: High Trust' : report.trust_score >= 40 ? 'Stream: Standard' : 'Least Trust (< 40)'}
                          </div>
                        </div>
                      </td>

                      {/* 9. Admin Governance Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Accept Button */}
                          <button
                            onClick={(e) => handleAcceptSingleReport(report.id, e)}
                            disabled={isProcessing || isAccepted}
                            className={`p-1.5 rounded-md border transition-all ${
                              isAccepted
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-600/30 opacity-70 cursor-default'
                                : 'bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border-emerald-500/40'
                            }`}
                            title={isAccepted ? 'Already Accepted' : 'Mark Accepted (Score ≥ 40)'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Mark Suspicious Button */}
                          <button
                            onClick={(e) => handleMarkSingleReportSuspicious(report.id, e)}
                            disabled={isProcessing || isSuspicious}
                            className={`p-1.5 rounded-md border transition-all ${
                              isSuspicious
                                ? 'bg-rose-950/30 text-rose-400 border-rose-600/30 opacity-70 cursor-default'
                                : 'bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border-rose-500/40'
                            }`}
                            title={isSuspicious ? 'Already Marked Suspicious' : 'Mark Suspicious (< 40 Least Trust)'}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          {/* View Dossier Button */}
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-1.5 rounded-md bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-[#2d3f5e] transition-colors"
                            title="Inspect AI & 5-Factor Dossier"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </div>
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

      {/* Report Dossier & AI 5-Factor Inspection Modal */}
      {selectedReport && (() => {
        const factors = get5FactorBreakdown(selectedReport);
        const isAccepted = selectedReport.trust_score >= 40 || selectedReport.verification_status === 'ACCEPTED' || selectedReport.verification_status === 'VERIFIED';
        const isSuspicious = selectedReport.trust_score < 40 || selectedReport.verification_status === 'SUSPICIOUS';

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121b2d] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{selectedReport.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#0e1626] border border-[#1e293b] font-mono text-slate-300">
                      Source: {selectedReport.source_id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedReport.event_category}</h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Raw Content */}
                <div className="bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Raw Telemetry Content</div>
                  <div className="text-slate-200 leading-relaxed font-sans">{selectedReport.text}</div>
                </div>

                {/* AI & 5-Factor Deterministic Breakdown Card */}
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

                    {/* Factor 5: Spatial Corroboration */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Factor 5: Cross-Source Corroboration & Clustering</span>
                        <span className="font-mono text-indigo-300 font-bold">{factors.corrobPoints} / 15.0 pts</span>
                      </div>
                      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full transition-all"
                          style={{ width: `${(factors.corrobPoints / 15.0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning Summary */}
                  {selectedReport.ai_reasoning && (
                    <div className="mt-3 pt-2.5 border-t border-[#1e293b] text-slate-300 text-[11px] leading-relaxed">
                      <strong className="text-slate-200">AI Governance Rationale:</strong> {selectedReport.ai_reasoning}
                    </div>
                  )}
                </div>

                {/* Visual Evidence Photos / Videos */}
                {selectedReport.media && selectedReport.media.length > 0 ? (
                  <div className="bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b] space-y-2">
                    <div className="text-[10px] text-sky-400 uppercase font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                        Attached Visual Evidence ({selectedReport.media.length})
                      </span>
                      <span className="text-emerald-400 font-mono text-[10px]">Visual Corroboration Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {selectedReport.media.map((item, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-[#1e293b] bg-black/60 group/media relative">
                          {item.media_type === 'VIDEO' || item.media_url?.startsWith('data:video') || item.media_url?.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                            <div className="space-y-1">
                              <video
                                src={item.media_url}
                                controls
                                className="w-full h-48 object-cover rounded-t-lg bg-black"
                              />
                              <div className="p-2 flex items-center justify-between text-[11px] text-slate-300 font-sans bg-[#0b111e]">
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <Video className="w-3.5 h-3.5" /> Video Capture
                                </span>
                                <a
                                  href={item.media_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-400 hover:underline flex items-center gap-0.5 text-[10px]"
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
                                  className="w-full h-48 object-cover group-hover/media:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> Open Full
                                </div>
                              </a>
                              {item.caption && (
                                <p className="p-2 text-[10px] text-slate-300 font-sans truncate bg-[#0b111e]">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b] text-slate-400 text-xs italic">
                    No visual media attached for this telemetry report.
                  </div>
                )}

                {/* Location and Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Location Coordinates</div>
                    <div className="font-bold text-slate-200 mt-0.5">{selectedReport.city}, {selectedReport.state}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}
                    </div>
                  </div>

                  <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Governance Decision</div>
                    <div className={`font-bold mt-0.5 ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Status: {isAccepted ? 'ACCEPTED' : 'SUSPICIOUS'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 mt-1">
                      Trust Score: {selectedReport.trust_score}/100 ({selectedReport.trust_score >= 40 ? 'Policy: Accepted' : 'Policy: Suspicious'})
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptSingleReport(selectedReport.id)}
                    disabled={isAccepted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isAccepted
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 opacity-60 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? 'Accepted' : 'Mark Accepted'}</span>
                  </button>

                  <button
                    onClick={() => handleMarkSingleReportSuspicious(selectedReport.id)}
                    disabled={isSuspicious}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isSuspicious
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30 opacity-60 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/50'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isSuspicious ? 'Suspicious' : 'Mark Suspicious (< 40)'}</span>
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
