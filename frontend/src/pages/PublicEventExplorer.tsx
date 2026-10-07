import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { getEvents } from '../services/api';
import { WeatherEvent } from '../types';
import {
  CloudRain,
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  Layers
} from 'lucide-react';

const FALLBACK_EVENTS: WeatherEvent[] = [
  {
    id: 'evt-001',
    title: 'Extreme Rainfall & Urban Inundation',
    event_category: 'Heavy Rainfall',
    severity: 'CRITICAL',
    confidence: 96,
    verification_status: 'VERIFIED',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    radius_km: 18,
    report_count: 142,
    source_count: 5,
    first_reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'IMD Red Alert issued. Severe waterlogging reported across Dadar, Kurla, and Andheri.'
  },
  {
    id: 'evt-002',
    title: 'Severe Thunderstorm & Lightning Strike',
    event_category: 'Thunderstorm',
    severity: 'HIGH',
    confidence: 88,
    verification_status: 'VERIFIED',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    radius_km: 12,
    report_count: 89,
    source_count: 4,
    first_reported_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'High wind squalls exceeding 65 km/h with localized power outages in eastern zones.'
  },
  {
    id: 'evt-003',
    title: 'Cyclonic Storm Tracking & Coastal Surge',
    event_category: 'Cyclone',
    severity: 'CRITICAL',
    confidence: 98,
    verification_status: 'VERIFIED',
    city: 'Bhubaneswar',
    district: 'Khurda',
    state: 'Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
    radius_km: 45,
    report_count: 215,
    source_count: 7,
    first_reported_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'Deep depression intensifying into severe cyclone over Bay of Bengal. SEOC team deployed.'
  },
  {
    id: 'evt-004',
    title: 'Flash Flood & River Inundation Warning',
    event_category: 'Flash Flood',
    severity: 'HIGH',
    confidence: 91,
    verification_status: 'VERIFIED',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    radius_km: 25,
    report_count: 110,
    source_count: 4,
    first_reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'Brahmaputra river level exceeding danger mark. Emergency relief shelters operating.'
  },
  {
    id: 'evt-005',
    title: 'Dense Fog & Low Visibility Alert',
    event_category: 'Dense Fog',
    severity: 'MEDIUM',
    confidence: 85,
    verification_status: 'VERIFIED',
    city: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    radius_km: 30,
    report_count: 64,
    source_count: 3,
    first_reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'Zero visibility at IGI airport causing flight delays. Highway speed restrictions applied.'
  },
  {
    id: 'evt-006',
    title: 'Severe Heatwave Alert',
    event_category: 'Heatwave',
    severity: 'HIGH',
    confidence: 94,
    verification_status: 'VERIFIED',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    radius_km: 40,
    report_count: 98,
    source_count: 5,
    first_reported_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    last_reported_at: new Date().toISOString(),
    is_active: true,
    summary: 'Temperatures crossing 44.5°C with severe hot wind conditions across western districts.'
  }
];

export const PublicEventExplorer: React.FC = () => {
  const [events, setEvents] = useState<WeatherEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    let isSubscribed = true;
    getEvents({ limit: 100 })
      .then((data) => {
        if (isSubscribed && data && data.length > 0) {
          setEvents(data);
        }
      })
      .catch((err) => console.warn('Using fallback public events data:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    return () => { isSubscribed = false; };
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.city.toLowerCase().includes(searchTerm.toLowerCase()) || e.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || e.event_category === categoryFilter;
    const matchesSeverity = !severityFilter || e.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'MEDIUM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Top Header */}
      <PublicHeader activePage="events" />

      {/* Header Offset */}
      <div className="h-28 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Standalone Feature Banner */}
        <div className="bg-[#0e172a] border border-[#1e293b] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CloudRain className="w-4 h-4 text-sky-400" />
                <span>Live Event Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
                Weather Event Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Inspect aggregated national weather incident clusters, telemetry status, and citizen verification signals across India.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {filteredEvents.length} ACTIVE CLUSTERS
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by city, state or event title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Categories</option>
              <option value="Heavy Rainfall">Heavy Rainfall</option>
              <option value="Thunderstorm">Thunderstorm</option>
              <option value="Cyclone">Cyclone</option>
              <option value="Flash Flood">Flash Flood</option>
              <option value="Dense Fog">Dense Fog</option>
              <option value="Heatwave">Heatwave</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#070c18] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        {/* Weather Incident Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#0d1627] border border-[#1e293b] hover:border-sky-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-sky-500/10 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {evt.event_category}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${getSeverityBadge(evt.severity)}`}>
                    {evt.severity}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-base group-hover:text-sky-300 transition-colors line-clamp-2">
                  {evt.title}
                </h3>

                <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                  {evt.summary || `Live weather cluster active over ${evt.city}, ${evt.state}. Monitoring sensor stream telemetry.`}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{evt.city}, {evt.state}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">{evt.report_count} Reports</span>
                  <button
                    onClick={() => navigate('/map')}
                    className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                    title="View on Geo-Analytics Map"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0a0f1a] py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} WeatherPulse Intelligence Grid. All rights reserved.</p>
      </footer>
    </div>
  );
};
