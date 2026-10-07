import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
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
  const { role, user } = useAuth();
  const isCitizen = role === 'CITIZEN' || user?.role === 'CITIZEN' || (user?.role as string) === 'VIEWER';

  if (!event) {
    return (
      <div className={`w-full max-w-full rounded-2xl p-5 border shadow-2xl flex flex-col items-center justify-center text-center gap-3 h-full min-h-[300px] ${
        isCitizen ? 'bg-[#080808] border-zinc-800 text-zinc-400' : 'bg-[#121b2d] border-[#1e293b] text-slate-400'
      }`}>
        <div className={`p-3.5 rounded-2xl ${isCitizen ? 'bg-zinc-900 text-white border border-zinc-700' : 'bg-[#1a263d] text-sky-400 border border-sky-500/20'}`}>
          <Radio className="w-7 h-7 animate-pulse" />
        </div>
        <div>
          <h3 className={`text-sm font-bold ${isCitizen ? 'text-white' : 'text-slate-200'}`}>
            Live Event Intelligence
          </h3>
          <p className={`text-xs mt-1.5 max-w-[220px] leading-relaxed ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
            Select any weather cluster on the map to inspect live telemetry & intelligence dossier.
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '14:21';
    }
  };

  return (
    <div className={`w-full max-w-full rounded-2xl p-4 border shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-right duration-300 h-full overflow-y-auto ${
      isCitizen ? 'bg-[#080808] border-zinc-800 text-white' : 'bg-[#121b2d] border-[#1e293b] text-slate-100'
    }`}>
      {/* Header */}
      <div className={`flex items-start justify-between border-b pb-3 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-bold uppercase ${isCitizen ? 'text-white' : 'text-sky-400'}`}>
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
          <h2 className="text-base font-bold">{event.event_category}</h2>
          <p className={`text-xs flex items-center gap-1 mt-0.5 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
            <MapPin className="w-3.5 h-3.5" />
            {event.city}, {event.state}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`p-3 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
          <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Severity</div>
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
        <div className={`p-3 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
          <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>AI Confidence</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {Math.round(event.confidence * 100)}%
          </div>
        </div>
        <div className={`p-3 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
          <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Corroborating Reports</div>
          <div className={`text-sm font-bold mt-0.5 ${isCitizen ? 'text-white' : 'text-slate-100'}`}>{event.report_count}</div>
        </div>
        <div className={`p-3 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
          <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Independent Sources</div>
          <div className={`text-sm font-bold mt-0.5 ${isCitizen ? 'text-white font-mono' : 'text-sky-400'}`}>{event.source_count}</div>
        </div>
      </div>

      {/* Timestamps */}
      <div className={`flex items-center justify-between text-xs px-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
        <span>First Telemetry: <strong className={`font-mono ${isCitizen ? 'text-white' : 'text-slate-200'}`}>{formatTime(event.first_reported_at)}</strong></span>
        <span>Last Pulse: <strong className={`font-mono ${isCitizen ? 'text-white' : 'text-slate-200'}`}>{formatTime(event.last_reported_at)}</strong></span>
      </div>

      {/* Incident Timeline */}
      <div className={`border-t pt-3 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${isCitizen ? 'text-white' : 'text-slate-300'}`}>
          <Clock className={`w-3.5 h-3.5 ${isCitizen ? 'text-white' : 'text-sky-400'}`} />
          Event Intelligence Timeline
        </div>
        <div className={`space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 ${isCitizen ? 'before:bg-zinc-800' : 'before:bg-[#1e293b]'}`}>
          <div className="relative pl-6">
            <span className={`absolute left-1 top-1 w-2.5 h-2.5 rounded-full ${isCitizen ? 'bg-white ring-4 ring-[#080808]' : 'bg-sky-500 ring-4 ring-[#121b2d]'}`} />
            <div className={`text-[11px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>{formatTime(event.first_reported_at)}</div>
            <div className={`text-xs font-medium ${isCitizen ? 'text-zinc-200' : 'text-slate-200'}`}>First telemetry ingested via IMD Open Data</div>
          </div>
          <div className="relative pl-6">
            <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#121b2d]" />
            <div className={`text-[11px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>T + 12 mins</div>
            <div className={`text-xs font-medium ${isCitizen ? 'text-zinc-200' : 'text-slate-200'}`}>{event.report_count} citizen and social reports linked in 15 km cluster</div>
          </div>
          <div className="relative pl-6">
            <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#121b2d]" />
            <div className={`text-[11px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>T + 24 mins</div>
            <div className={`text-xs font-medium ${isCitizen ? 'text-zinc-200' : 'text-slate-200'}`}>AI trust scoring validated with {Math.round(event.confidence * 100)}% confidence</div>
          </div>
        </div>
      </div>

      {/* Full View Button */}
      <button
        onClick={() => navigate(`/events/${event.id}`)}
        className={`w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
          isCitizen ? 'bg-white text-black hover:bg-zinc-200' : 'bg-sky-600 hover:bg-sky-500 text-white'
        }`}
      >
        <span>View Full Event Intelligence</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
