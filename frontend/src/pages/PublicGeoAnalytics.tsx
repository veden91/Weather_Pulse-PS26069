import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { getEvents } from '../services/api';
import { WeatherEvent } from '../types';
import { IndiaWeatherMap } from '../maps/IndiaWeatherMap';
import {
  Map,
  Radio,
  ExternalLink,
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

export const PublicGeoAnalytics: React.FC = () => {
  const [events, setEvents] = useState<WeatherEvent[]>(FALLBACK_EVENTS);
  const [selectedMapEvent, setSelectedMapEvent] = useState<WeatherEvent | null>(FALLBACK_EVENTS[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isSubscribed = true;
    getEvents({ limit: 100 })
      .then((data) => {
        if (isSubscribed && data && data.length > 0) {
          setEvents(data);
          setSelectedMapEvent(data[0]);
        }
      })
      .catch((err) => console.warn('Using fallback public map data:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    return () => { isSubscribed = false; };
  }, []);

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
    <div className="h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Top Header */}
      <PublicHeader activePage="map" />

      {/* Header Offset */}
      <div className="h-24 shrink-0" aria-hidden="true" />

      {/* Main Map Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 w-full flex flex-col min-h-0 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              <span>India Geo-Analytics GIS Map</span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive multi-layered GIS workspace centered on India with live satellite precipitation radar overlays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 hidden sm:flex">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>OpenWeather Radar Active</span>
            </span>
          </div>
        </div>

        {/* GIS Map & Telemetry Drawer Split Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-2xl overflow-hidden border border-[#1e293b] bg-[#050811] min-h-0">
          {/* Map Container (8 cols) */}
          <div className="lg:col-span-8 relative h-full w-full overflow-hidden">
            <IndiaWeatherMap
              events={events}
              selectedEventId={selectedMapEvent?.id}
              onSelectEvent={(evt) => setSelectedMapEvent(evt)}
              height="100%"
              isCitizen={true}
            />
          </div>

          {/* Selected Event Telemetry Drawer (4 cols) */}
          <div className="lg:col-span-4 bg-[#090f1e] p-5 border-l border-[#1e293b] flex flex-col justify-between overflow-y-auto">
            {selectedMapEvent ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-[#1e293b] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      Selected GIS Cluster
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm mt-1">
                      {selectedMapEvent.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(selectedMapEvent.severity)}`}>
                    {selectedMapEvent.severity}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-[#1e293b]/50">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-sky-400">{selectedMapEvent.event_category}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#1e293b]/50">
                    <span className="text-slate-400">Location</span>
                    <span className="font-semibold text-slate-200">{selectedMapEvent.city}, {selectedMapEvent.state}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#1e293b]/50">
                    <span className="text-slate-400">Coordinates</span>
                    <span className="font-mono text-slate-300">{selectedMapEvent.latitude.toFixed(2)}°N, {selectedMapEvent.longitude.toFixed(2)}°E</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#1e293b]/50">
                    <span className="text-slate-400">Report Count</span>
                    <span className="font-mono font-bold text-amber-400">{selectedMapEvent.report_count} verified signals</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-[#050914] p-3 rounded-xl border border-[#1e293b]">
                  {selectedMapEvent.summary || 'Real-time meteorological cluster verified by multi-source telemetry.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Map className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Click any marker on the map to inspect geospatial telemetry.</p>
              </div>
            )}

            <div className="pt-4 border-t border-[#1e293b]">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Access Full Operational GIS Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
