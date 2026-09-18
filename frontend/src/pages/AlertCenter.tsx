import React, { useEffect, useState } from 'react';
import { getAlerts, createAlert } from '../services/api';
import { EmergencyAlert } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  Plus,
  Clock,
  TrendingUp,
  MapPin,
  X,
  Radio
} from 'lucide-react';

export const AlertCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('HIGH');
  const [category, setCategory] = useState('Heavy Rainfall');
  const [city, setCity] = useState('Lucknow');
  const [state, setState] = useState('Uttar Pradesh');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAlert({
        title,
        description,
        alert_level: level,
        category,
        city,
        state,
        latitude: 26.8467,
        longitude: 80.9462,
        report_count: 24,
        trend_description: '+28% in last 30 minutes',
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchAlerts();
    } catch (err) {
      console.error('Error dispatching alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            National Weather Emergency Alert Center
            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
              {alerts.length} ACTIVE ADVISORIES
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 27: Multi-hazard early warnings dispatched to State Emergency Operations Centers (SEOCs) & district collectors.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch Emergency Alert</span>
        </button>
      </div>

      {/* Active Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            Polling active national disaster alert registry...
          </div>
        ) : alerts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            No active emergency weather advisories at this moment.
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-5 rounded-xl border shadow-xl flex flex-col justify-between ${
                alt.alert_level === 'CRITICAL'
                  ? 'bg-red-950/30 border-red-500/40'
                  : alt.alert_level === 'HIGH'
                  ? 'bg-orange-950/30 border-orange-500/40'
                  : 'bg-[#121b2d] border-[#1e293b]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        alt.alert_level === 'CRITICAL'
                          ? 'bg-red-500/30 text-red-300 animate-pulse'
                          : alt.alert_level === 'HIGH'
                          ? 'bg-orange-500/30 text-orange-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      ● {alt.alert_level}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-300">{alt.id}</span>
                  </div>
                  <span className="text-xs font-bold text-sky-400">{alt.category}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mb-1.5">{alt.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{alt.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{alt.city}, {alt.state}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-400">Reports: <strong className="text-slate-200">{alt.report_count}</strong></span>
                  <span className="text-red-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>{alt.trend_description}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dispatch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121b2d] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-slate-100">Broadcast National Weather Alert</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Alert Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-slate-200"
                >
                  <option value="CRITICAL">CRITICAL (Red Warning)</option>
                  <option value="HIGH">HIGH (Orange Alert)</option>
                  <option value="MEDIUM">MEDIUM (Yellow Watch)</option>
                  <option value="INFO">INFO (Advisory)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Alert Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash Flood Emergency Warning in Patna"
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description & Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide immediate advisories, river water levels, or evacuation instructions..."
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#1e293b] text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
