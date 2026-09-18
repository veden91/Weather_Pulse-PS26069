import React, { useEffect, useState } from 'react';
import { getReports } from '../services/api';
import { WeatherReport } from '../types';
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
  ShieldAlert
} from 'lucide-react';

export const ReportsExplorer: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports({
        search: search || undefined,
        verification_status: statusFilter || undefined,
        source_id: sourceFilter || undefined,
        limit: 100,
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
        <button
          onClick={exportCSV}
          className="px-3.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export All Reports (CSV)</span>
        </button>
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
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            Loading reports stream...
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            No reports found matching selected criteria.
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep)}
              className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-4 flex flex-col justify-between hover:border-sky-500/50 transition-all cursor-pointer shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-sky-400">{rep.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      rep.verification_status === 'VERIFIED'
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
                  <span className="text-sky-300 font-bold">{rep.event_category}</span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                  {rep.text}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{rep.city}, {rep.state}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-emerald-400">
                    Trust: {rep.trust_score}/100
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121b2d] border border-[#1e293b] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
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
