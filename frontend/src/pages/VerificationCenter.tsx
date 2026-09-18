import React, { useEffect, useState } from 'react';
import { getVerificationQueue, executeVerificationAction } from '../services/api';
import { WeatherReport } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Flame,
  Radio,
  ExternalLink,
  MapPin
} from 'lucide-react';

const TABS = [
  { id: 'PENDING_REVIEW', label: 'Pending Review' },
  { id: 'AI_FLAGGED', label: 'AI Flagged (Score 40-69)' },
  { id: 'SUSPICIOUS', label: 'Suspicious Anomalies' },
  { id: 'HIGH_IMPACT', label: 'High Severity / Critical' },
  { id: 'RECENT', label: 'Recent Ingestion' }
];

export const VerificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING_REVIEW');
  const [queue, setQueue] = useState<WeatherReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const reports = await getVerificationQueue(activeTab);
      setQueue(reports);
    } catch (err) {
      console.error('Error fetching verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleAction = async (
    reportId: string,
    action: 'VERIFY' | 'REJECT' | 'MARK_SUSPICIOUS' | 'REQUEST_REVIEW' | 'ESCALATE'
  ) => {
    try {
      await executeVerificationAction(reportId, action, `Duty analyst executed ${action}`);
      setActionSuccessMsg(`Report ${reportId} marked as ${action} successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      // Remove from current list
      setQueue((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Failed to execute verification action:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            AI Human-in-the-Loop Verification Center
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              DUTY CELL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 26 & 30 decision-support queue for corroborating crowdsourced posts against IMD ground truth.
          </p>
        </div>

        {/* Action toast */}
        {actionSuccessMsg && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-in fade-in">
            ✓ {actionSuccessMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#152033]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#121b2d] p-12 text-center text-slate-400 text-xs rounded-xl border border-[#1e293b]">
            Scanning AI trust scoring index...
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-[#121b2d] p-12 text-center text-slate-400 text-xs rounded-xl border border-[#1e293b]">
            ✓ All reports in the <strong className="text-slate-200">{activeTab}</strong> queue have been processed.
          </div>
        ) : (
          queue.map((report) => (
            <div
              key={report.id}
              className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-5 shadow-xl space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-sky-400">{report.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#0e1626] border border-[#1e293b] font-mono text-slate-300">
                    Source: {report.source_id}
                  </span>
                  <span className="text-xs font-bold text-slate-100">{report.event_category}</span>
                </div>

                {/* Section 13: Trust Score Gauge */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Trust Score</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {report.trust_score} / 100
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      report.trust_score >= 90
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : report.trust_score >= 70
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : report.trust_score >= 40
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {report.trust_score >= 90
                      ? 'Verified'
                      : report.trust_score >= 70
                      ? 'Likely Reliable'
                      : report.trust_score >= 40
                      ? 'Needs Review'
                      : 'Suspicious'}
                  </div>
                </div>
              </div>

              {/* Report Body & Reasoning */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                <div className="md:col-span-7 bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b] space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Report Content</div>
                  <p className="text-slate-100 leading-relaxed font-sans">{report.text}</p>
                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-[#1e293b]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.city}, {report.state}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(report.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                  </div>
                </div>

                <div className="md:col-span-5 bg-[#0e1626] p-3.5 rounded-lg border border-[#1e293b] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-sky-400 uppercase font-semibold">
                      AI Reasoning & Correlation Summary
                    </div>
                    <p className="text-slate-300 italic text-[11px] mt-1 leading-relaxed">
                      {report.ai_reasoning ||
                        'NLP classifier categorized report with high lexical confidence; spatial coordinates match localized catchment.'}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-[#1e293b]">
                    Model: WeatherPulse-Ensemble-v1 (Confidence: {Math.round(report.confidence * 100)}%)
                  </div>
                </div>
              </div>

              {/* Action Buttons (Section 26 & 30) */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  onClick={() => handleAction(report.id, 'VERIFY')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>[VERIFY]</span>
                </button>

                <button
                  onClick={() => handleAction(report.id, 'MARK_SUSPICIOUS')}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>[MARK SUSPICIOUS]</span>
                </button>

                <button
                  onClick={() => handleAction(report.id, 'REQUEST_REVIEW')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>[REQUEST REVIEW]</span>
                </button>

                <button
                  onClick={() => handleAction(report.id, 'REJECT')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>[REJECT]</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
