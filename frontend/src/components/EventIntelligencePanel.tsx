import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WeatherEvent } from '../types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Radio,
  FileText,
  MapPin,
  ExternalLink,
  Zap
} from 'lucide-react';

interface EventIntelligencePanelProps {
  event: WeatherEvent | null;
  onClose: () => void;
}

export const EventIntelligencePanel: React.FC<EventIntelligencePanelProps> = ({ event, onClose }) => {
  const navigate = useNavigate();

  if (!event) return null;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '14:21';
    }
  };

  return (
    <div className="w-full lg:w-96 bg-[#121b2d] border border-[#1e293b] rounded-xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase">
              {event.id}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                event.verification_status === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              ● {event.verification_status}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100">{event.event_category}</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {event.city}, {event.state}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Severity</div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              event.severity === 'CRITICAL'
                ? 'text-red-400'
                : event.severity === 'HIGH'
                ? 'text-orange-400'
                : 'text-amber-400'
            }`}
          >
            {event.severity}
          </div>
        </div>
        <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {Math.round(event.confidence * 100)}%
          </div>
        </div>
        <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Corroborating Reports</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{event.report_count}</div>
        </div>
        <div className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Independent Sources</div>
          <div className="text-sm font-bold text-sky-400 mt-0.5">{event.source_count}</div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>First Telemetry: <strong className="text-slate-200 font-mono">{formatTime(event.first_reported_at)}</strong></span>
        <span>Last Pulse: <strong className="text-slate-200 font-mono">{formatTime(event.last_reported_at)}</strong></span>
      </div>

      {/* Incident Timeline (Section 57) */}
      <div className="border-t border-[#1e293b] pt-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          Event Intelligence Timeline
        </div>
        <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e293b]">
          <div className="relative pl-6">
            <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-[#121b2d]" />
            <div className="text-[11px] font-mono text-slate-400">{formatTime(event.first_reported_at)}</div>
            <div className="text-xs text-slate-200 font-medium">First telemetry ingested via IMD Open Data</div>
          </div>
          <div className="relative pl-6">
            <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#121b2d]" />
            <div className="text-[11px] font-mono text-slate-400">T + 12 mins</div>
            <div className="text-xs text-slate-200 font-medium">{event.report_count} citizen and social reports linked in 15 km cluster</div>
          </div>
          <div className="relative pl-6">
            <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#121b2d]" />
            <div className="text-[11px] font-mono text-slate-400">T + 24 mins</div>
            <div className="text-xs text-slate-200 font-medium">AI trust scoring validated with {Math.round(event.confidence * 100)}% confidence</div>
          </div>
        </div>
      </div>

      {/* Full View Button */}
      <button
        onClick={() => navigate(`/events/${event.id}`)}
        className="w-full mt-2 py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
      >
        <span>View Full Event Intelligence</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
