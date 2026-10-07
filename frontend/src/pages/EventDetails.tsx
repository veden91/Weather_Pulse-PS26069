import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../services/api';
import { useAuth } from '../store/authContext';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const isCitizen = role === 'CITIZEN' || user?.role === 'CITIZEN' || (user?.role as string) === 'VIEWER';

  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getEventById(id)
        .then((data) => setEventData(data))
        .catch((err) => console.error('Error fetching event details:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className={`p-8 text-center text-sm ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
        Loading event telemetry dossier...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className={`p-8 text-center text-sm ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
        Weather event cluster not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
            isCitizen ? 'text-zinc-300 hover:text-white font-bold' : 'text-sky-400 hover:text-sky-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Explorer</span>
        </button>
        <span className={`font-mono text-xs ${isCitizen ? 'text-zinc-400 font-bold' : 'text-slate-400'}`}>ID: {eventData.id}</span>
      </div>

      {/* Main Event Summary Card */}
      <div className={`rounded-2xl border p-6 shadow-2xl ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${
                isCitizen ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                {eventData.id}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold ${
                  eventData.verification_status === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                ● {eventData.verification_status}
              </span>
            </div>
            <h1 className={`text-xl font-bold ${isCitizen ? 'text-white' : 'text-slate-100'}`}>{eventData.title}</h1>
            <p className={`text-xs flex items-center gap-1.5 mt-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
              <MapPin className={`w-4 h-4 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`} />
              <span>{eventData.city}, {eventData.state} (Lat: {eventData.latitude.toFixed(4)}, Lon: {eventData.longitude.toFixed(4)})</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border text-center ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
              <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Severity</div>
              <div className="text-base font-bold text-red-400 font-mono">{eventData.severity}</div>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-center ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
              <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>AI Confidence</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {Math.round(eventData.confidence * 100)}%
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-center ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
              <div className={`text-[10px] uppercase font-semibold ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Reports</div>
              <div className={`text-base font-bold font-mono ${isCitizen ? 'text-white' : 'text-slate-100'}`}>{eventData.report_count}</div>
            </div>
          </div>
        </div>

        <div className={`mt-4 text-xs leading-relaxed ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>
          {eventData.summary || 'Automated weather event cluster compiled by national big data pipeline.'}
        </div>
      </div>

      {/* Grid: Timeline & Verification History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Chronological Timeline */}
        <div className={`p-5 rounded-2xl border ${isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isCitizen ? 'text-white' : 'text-slate-200'}`}>
            <Clock className={`w-4 h-4 ${isCitizen ? 'text-white' : 'text-sky-400'}`} />
            <span>Chronological Incident Timeline</span>
          </h3>
          <div className={`space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 ${isCitizen ? 'before:bg-zinc-800' : 'before:bg-[#1e293b]'}`}>
            {eventData.timeline?.map((item: any, idx: number) => (
              <div key={idx} className="relative pl-7">
                <span className={`absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full ${isCitizen ? 'bg-white ring-4 ring-[#080808]' : 'bg-sky-500 ring-4 ring-[#121b2d]'}`} />
                <div className={`text-[11px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`text-xs font-bold mt-0.5 ${isCitizen ? 'text-white' : 'text-slate-200'}`}>{item.title}</div>
                <div className={`text-xs mt-0.5 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification History & Decisions */}
        <div className={`p-5 rounded-2xl border ${isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isCitizen ? 'text-white' : 'text-slate-200'}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verification Audit Trail & Decisions</span>
          </h3>
          {eventData.verification_history?.length === 0 ? (
            <div className={`p-6 text-center text-xs rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800 text-zinc-400' : 'bg-[#0e1626] border-[#1e293b] text-slate-400'}`}>
              Pending initial manual review in AI Verification Center.
            </div>
          ) : (
            <div className="space-y-3">
              {eventData.verification_history?.map((vh: any) => (
                <div key={vh.id} className={`p-3 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">{vh.action}</span>
                    <span className={`text-[10px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                      {new Date(vh.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>{vh.notes}</p>
                  <div className={`mt-1 text-[10px] ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                    Decision Officer: <strong className={isCitizen ? 'text-white' : 'text-slate-200'}>{vh.verified_by}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Corroborating Reports List */}
      <div className={`p-5 rounded-2xl border ${isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isCitizen ? 'text-white' : 'text-slate-200'}`}>
            <FileText className={`w-4 h-4 ${isCitizen ? 'text-white' : 'text-sky-400'}`} />
            <span>Corroborating Reports in this Cluster ({eventData.reports?.length || 0})</span>
          </h3>
          <span className={`text-xs font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Spatial Radius: {eventData.radius_km} km</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventData.reports?.map((rep: any) => (
            <div key={rep.id} className={`p-4 rounded-xl border ${isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'}`}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`font-mono font-bold ${isCitizen ? 'text-white' : 'text-sky-400'}`}>{rep.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${isCitizen ? 'bg-zinc-900 text-zinc-200 border-zinc-700' : 'bg-sky-500/20 text-sky-300'}`}>
                  {rep.source_id}
                </span>
              </div>
              <p className={`text-xs ${isCitizen ? 'text-zinc-200' : 'text-slate-200'}`}>{rep.text}</p>
              <div className={`mt-3 flex items-center justify-between text-[11px] pt-2 border-t ${isCitizen ? 'border-zinc-800 text-zinc-400' : 'border-[#1e293b] text-slate-400'}`}>
                <span>Trust Score: <strong className="text-emerald-400">{rep.trust_score}/100</strong></span>
                <span className="font-mono">{new Date(rep.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
