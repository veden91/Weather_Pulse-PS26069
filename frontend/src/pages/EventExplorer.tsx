import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getEvents } from '../services/api';
import { useAuth } from '../store/authContext';
import { WeatherEvent } from '../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

export const EventExplorer: React.FC = () => {
  const { role, user } = useAuth();
  const isCitizen = role === 'CITIZEN' || user?.role === 'CITIZEN' || (user?.role as string) === 'VIEWER';

  const [events, setEvents] = useState<WeatherEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        state: stateFilter || undefined,
        verification_status: statusFilter || undefined,
        limit: 100,
      });
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [categoryFilter, severityFilter, stateFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const exportCSV = () => {
    window.open('http://localhost:8000/api/v1/events?format=csv', '_blank');
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'weatherpulse_events.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xl ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-2 ${isCitizen ? 'text-white' : 'text-slate-100'}`}>
            Weather Event Intelligence Explorer
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${isCitizen ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-sky-500/20 text-sky-300'}`}>
              {events.length} CLUSTERS
            </span>
          </h1>
          <p className={`text-xs mt-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
            Browse, filter, and inspect aggregated national weather incident clusters and geospatial telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isCitizen ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white' : 'bg-[#152033] hover:bg-[#1e293b] border-[#1e293b] text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isCitizen ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white' : 'bg-[#152033] hover:bg-[#1e293b] border-[#1e293b] text-slate-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isCitizen ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Event ID, City, State, or Event Category..."
              className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none ${
                isCitizen ? 'bg-[#000000] border border-zinc-800 text-white placeholder-zinc-500 focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-100 placeholder-slate-400 focus:border-sky-500'
              }`}
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isCitizen ? 'bg-white text-black hover:bg-zinc-200 shadow-md' : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            Search
          </button>
        </form>

        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
              isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
            }`}
          >
            <option value="">All Categories</option>
            <option value="Heavy Rainfall">Heavy Rainfall</option>
            <option value="Flood">Flood / Flash Flood</option>
            <option value="Thunderstorm">Thunderstorm</option>
            <option value="Heatwave">Heatwave</option>
            <option value="Dense Fog">Dense Fog</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Strong Wind">Strong Wind</option>
            <option value="Cloudburst">Cloudburst</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
              isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
            }`}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* State */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
              isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
            }`}
          >
            <option value="">All States</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Bihar">Bihar</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Delhi">Delhi</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Karnataka">Karnataka</option>
          </select>

          {/* Verification */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
              isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
            }`}
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Review</option>
            <option value="SUSPICIOUS">Suspicious</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-2xl ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                isCitizen ? 'bg-[#000000] border-zinc-800 text-zinc-400' : 'bg-[#0e1626] border-[#1e293b] text-slate-400'
              }`}>
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Event Category</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">AI Confidence</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reports</th>
                <th className="py-3.5 px-4">Last Telemetry</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isCitizen ? 'divide-zinc-800/80' : 'divide-[#1e293b]'}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className={`py-8 text-center ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                    Loading weather intelligence clusters...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-8 text-center ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                    No weather event clusters match your criteria.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className={`transition-colors ${isCitizen ? 'hover:bg-zinc-900' : 'hover:bg-[#18233a]'}`}>
                    <td className={`py-3.5 px-4 font-mono font-bold ${isCitizen ? 'text-zinc-100' : 'text-sky-400'}`}>{evt.id}</td>
                    <td className={`py-3.5 px-4 font-semibold ${isCitizen ? 'text-white' : 'text-slate-200'}`}>{evt.event_category}</td>
                    <td className="py-3.5 px-4">
                      <div className={isCitizen ? 'text-zinc-200 font-semibold' : 'text-slate-300'}>{evt.city}</div>
                      <div className={`text-[10px] ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>{evt.state}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : evt.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {Math.round(evt.confidence * 100)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          evt.verification_status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {evt.verification_status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>{evt.report_count}</td>
                    <td className={`py-3.5 px-4 font-mono text-[11px] ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
                      {new Date(evt.last_reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/events/${evt.id}`)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all ${
                          isCitizen
                            ? 'bg-zinc-800 hover:bg-white hover:text-black text-white border border-zinc-600'
                            : 'bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
