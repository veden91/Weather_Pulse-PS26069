import React, { useEffect, useState } from 'react';
import { getReports } from '../services/api';
import { WeatherReport } from '../types';
import { formatIngestionDate, getTimeAgo } from '../utils/dateFormatter';
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
  RefreshCw
} from 'lucide-react';

export const ReportsExplorer: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [mediaOnlyFilter, setMediaOnlyFilter] = useState(false);

  const displayedReports = mediaOnlyFilter
    ? reports.filter((r) => r.media && r.media.length > 0)
    : reports;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports({
        search: search || undefined,
        verification_status: statusFilter || undefined,
        source_id: sourceFilter || undefined,
        limit: 250,
      });
      setReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports();
    }, 15000); // Auto-refresh reports stream from PostgreSQL every 15s
    return () => clearInterval(interval);
  }, [statusFilter, sourceFilter]);

  const exportCSV = () => {
    window.open('http://localhost:8000/api/v1/reports?format=csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Multi-Source Weather Reports Stream
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              {reports.length} RAW RECORDS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Individual telemetry, social posts, sensor readings, and citizen crowd reports ingested across India.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchReports()}
            className="px-3.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] hover:border-sky-500/50 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
            title="Refresh reports directly from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-semibold text-slate-300 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export All Reports (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
            placeholder="Search report text, city, state, or report ID..."
            className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Verification Statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending Review</option>
          <option value="SUSPICIOUS">Suspicious</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-[#0e1626] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Data Sources</option>
          <option value="IMD_OPEN_DATA">IMD Open Data</option>
          <option value="TWITTER_FEED">Social Media #IMD</option>
          <option value="CITIZEN_PORTAL">Citizen Crowd Portal</option>
          <option value="GOVT_WEATHER_API">Weather Station APIs</option>
          <option value="PUBLIC_DATASET">Open Govt Data</option>
        </select>

        <button
          onClick={() => setMediaOnlyFilter(!mediaOnlyFilter)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border whitespace-nowrap ${mediaOnlyFilter
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-[#0e1626] text-slate-300 border-[#1e293b] hover:border-slate-600'
            }`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Visual Media Only</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            Loading reports stream...
          </div>
        ) : displayedReports.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            No reports found matching selected criteria.
          </div>
        ) : (
          displayedReports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep)}
              className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-4 flex flex-col justify-between hover:border-sky-500/50 transition-all cursor-pointer shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-sky-400">{rep.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${rep.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : rep.verification_status === 'SUSPICIOUS'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                  >
                    {rep.verification_status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[10px] font-mono text-slate-400">
                    {rep.source_id}
                  </span>
                  <span>•</span>
                  {rep.media && rep.media.length > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-mono">
                      <Camera className="w-3 h-3 text-sky-400" />
                      <span>{rep.media.length} Media</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                  {rep.text}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e293b] flex flex-col gap-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rep.city}, {rep.state}</span>
                  </span>
                  <span className="font-mono font-semibold text-emerald-400">
                    Trust: {rep.trust_score}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#1e293b]/50">
                  <span className="flex items-center gap-1 text-sky-300">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>{formatIngestionDate(rep.ingested_at || rep.reported_at)}</span>
                  </span>
                  <span>{getTimeAgo(rep.ingested_at || rep.reported_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121b2d] border border-[#1e293b] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-sky-400">{selectedReport.id}</span>
                <h3 className="text-base font-bold text-slate-100">{selectedReport.event_category}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Raw Report Text</div>
                <div className="text-slate-200 leading-relaxed font-sans">{selectedReport.text}</div>
              </div>

              {/* Attached Media Evidence Gallery */}
              {selectedReport.media && selectedReport.media.length > 0 && (
                <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b] space-y-2">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Location</div>
                  <div className="font-bold text-slate-200 mt-0.5">{selectedReport.city}, {selectedReport.state}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                  </div>
                </div>

                <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Source & Trust</div>
                  <div className="font-bold text-sky-400 mt-0.5">{selectedReport.source_id}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    Trust Score: {selectedReport.trust_score} / 100
                  </div>
                </div>
              </div>

              {selectedReport.ai_reasoning && (
                <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">AI Reasoning</div>
                  <p className="text-slate-300 italic">{selectedReport.ai_reasoning}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
