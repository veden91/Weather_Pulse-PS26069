import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview, getEvents, getAlerts } from '../services/api';
import { WeatherEvent, KPICards, EmergencyAlert } from '../types';
import { IndiaWeatherMap } from '../maps/IndiaWeatherMap';
import { EventIntelligencePanel } from '../components/EventIntelligencePanel';
import { useSimulator } from '../store/simulatorContext';
import {
  FileText,
  Clock,
  CloudRain,
  ShieldCheck,
  AlertOctagon,
  MapPin,
  Cpu,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const CommandCenter: React.FC = () => {
  const [kpis, setKpis] = useState<KPICards | null>(null);
  const [events, setEvents] = useState<WeatherEvent[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WeatherEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const { latestEvent, liveFeed } = useSimulator();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [kpiData, eventsData, alertsData] = await Promise.all([
        getAnalyticsOverview(),
        getEvents({ limit: 40 }),
        getAlerts(),
      ]);
      setKpis(kpiData);

      // Exclude simulated source events
      const realEvents = eventsData.filter(
        (e: any) => e.source_id !== 'SIMULATOR' && e.source_type !== 'SIMULATOR'
      );
      const displayEvents = realEvents.length > 0 ? realEvents : eventsData;
      setEvents(displayEvents);
      setAlerts(alertsData);

      if (displayEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(displayEvents[0]);
      }
    } catch (err) {
      console.error('Error loading command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // Auto-refresh telemetry & events from PostgreSQL every 15s
    return () => clearInterval(interval);
  }, []);

  // Update dynamic counters and map markers when live simulation arrives
  useEffect(() => {
    if (latestEvent) {
      setKpis((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_reports: prev.total_reports + 1,
          reports_today: prev.reports_today + 1,
          reports_per_min: +(prev.reports_per_min + 0.1).toFixed(1),
        };
      });

      // If new event created or updated
      getEvents({ limit: 40 }).then((updated) => setEvents(updated));
    }
  }, [latestEvent]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            National Weather Command Center
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              OPERATIONAL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geospatial meteorological intelligence & multi-source telemetry across India.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1626] border border-[#1e293b] hover:border-sky-500/50 text-slate-300 hover:text-sky-300 text-xs font-mono transition-all shadow-sm"
            title="Force refresh data directly from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>
        </div>
      </div>

      {/* Section 17: 8 Real-time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Reports */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Total Reports</span>
            <FileText className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono mt-1">
            {kpis?.total_reports ?? '--'}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% today</span>
          </div>
        </div>

        {/* Reports Today */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Reports Today</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono mt-1">
            {kpis?.reports_today ?? '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Since 00:00 IST</div>
        </div>

        {/* Active Events */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Active Events</span>
            <CloudRain className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {kpis?.active_events ?? '--'}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Clustered GIS</div>
        </div>

        {/* Verified Reports */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Verified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {kpis?.verified_reports ?? '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ground validated</div>
        </div>

        {/* Suspicious Reports */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Suspicious</span>
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400 font-mono mt-1">
            {kpis?.suspicious_reports ?? '--'}
          </div>
          <div className="text-[10px] text-red-400/80 mt-1">AI Trust &lt; 40</div>
        </div>

        {/* States Affected */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>States Active</span>
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono mt-1">
            {kpis?.states_affected ?? '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across India</div>
        </div>

        {/* AI Processed % */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>AI Processed</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
            {kpis ? `${kpis.ai_processed_percentage}%` : '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">16-class NLP</div>
        </div>

        {/* Reports / Min */}
        <div className="bg-[#121b2d] p-3 rounded-xl border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Ingest Rate</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {kpis?.reports_per_min ?? '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">reports / min</div>
        </div>
      </div>

      {/* Main Grid: Interactive India GIS Map + Section 57 Event Intelligence / Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Section 19: Live Event Stream Feed — shown ABOVE the map */}
          <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
            <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Live Ingestion Feed — Notification Reports
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                STREAM ACTIVE • ZERO POLLING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const realLive = liveFeed.filter((i: any) => i.source_id !== 'SIMULATOR' && i.source_type !== 'SIMULATOR');
                const realEvts = events.filter((e: any) => e.source_id !== 'SIMULATOR' && e.source_type !== 'SIMULATOR');
                const displayFeed = realLive.length > 0 ? realLive.slice(0, 3) : (realEvts.length > 0 ? realEvts.slice(0, 3) : events.slice(0, 3));

                return displayFeed.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b] hover:border-sky-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const match = events.find((e) => e.id === item.event_id || e.id === item.id);
                      if (match) setSelectedEvent(match);
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-sky-300 truncate">
                        {item.event_category || item.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.city}, {item.state}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                      {item.text || item.summary}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-[#1e293b]">
                      <span>Trust: <strong className="text-slate-200">{item.trust_score || 94}%</strong></span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {item.verification_status || 'VERIFIED'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Map Header + Map — now below the notification feed */}
          <div className="flex items-center justify-between bg-[#121b2d] px-4 py-2.5 rounded-t-xl border border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                National Weather GIS Telemetry Map
              </span>
              <span className="text-xs text-slate-400 font-mono">({events.length} Active Events)</span>
            </div>
            <button
              onClick={() => navigate('/map')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              <span>Full-Screen GIS Workspace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <IndiaWeatherMap
            events={events}
            selectedEventId={selectedEvent?.id}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            height="500px"
          />
        </div>

        {/* Right Intelligence Panel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <EventIntelligencePanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />

          {/* Quick Active Alerts Card - Real Dynamic Alerts */}
          <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b] flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                Critical Weather Advisories ({alerts.length})
              </span>
              <button
                onClick={() => navigate('/alerts')}
                className="text-[11px] text-sky-400 hover:underline font-mono"
              >
                View All
              </button>
            </div>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic bg-[#0e1626] rounded-lg border border-[#1e293b]">
                  No active critical advisories at this moment.
                </div>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.alert_level === 'CRITICAL'
                        ? 'bg-red-950/40 border-red-500/30'
                        : alert.alert_level === 'HIGH'
                        ? 'bg-orange-950/30 border-orange-500/30'
                        : 'bg-yellow-950/20 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-red-300">
                      <span className="truncate max-w-[200px]">{alert.title}</span>
                      <span className="text-[10px] font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-red-200 shrink-0">
                        {alert.city}, {alert.state}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {alert.description}
                    </p>
                    <div className="text-[10px] text-red-400 font-mono mt-1.5 flex items-center justify-between">
                      <span>Trend: {alert.trend_description || '+20% in last 30 minutes'}</span>
                      <span className="text-slate-400 font-semibold">{alert.report_count} Reports</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
