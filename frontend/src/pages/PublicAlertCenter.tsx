import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { getAlerts } from '../services/api';
import { EmergencyAlert } from '../types';
import {
  AlertTriangle,
  Clock,
  MapPin,
  ShieldAlert,
  Radio,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

const FALLBACK_ALERTS: EmergencyAlert[] = [
  {
    id: 'alt-001',
    title: 'RED ALERT: Severe Heavy Rainfall & Urban Flood Risk',
    description: 'IMD issues Red Alert for Mumbai & Thane districts. Expected rainfall > 200mm in 24 hrs.',
    alert_level: 'CRITICAL',
    category: 'Heavy Rainfall',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    report_count: 142,
    trend_description: '+45% reports in last hour',
    is_active: true,
    issued_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'alt-002',
    title: 'ORANGE ADVISORY: Cyclonic Wind Squalls & High Waves',
    description: 'Coastal Odisha & West Bengal districts under high storm surge advisory. Fishermen instructed not to venture into sea.',
    alert_level: 'HIGH',
    category: 'Cyclone',
    city: 'Bhubaneswar',
    state: 'Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
    report_count: 215,
    trend_description: '+30% report surge',
    is_active: true,
    issued_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'alt-003',
    title: 'FLASH FLOOD WATCH: Rising Brahmaputra River Levels',
    description: 'NDRF units deployed in Kamrup and surrounding districts. Citizens advised to move to elevated relief camps.',
    alert_level: 'HIGH',
    category: 'Flash Flood',
    city: 'Guwahati',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    report_count: 110,
    trend_description: '+18% reports in 30m',
    is_active: true,
    issued_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'alt-004',
    title: 'YELLOW ADVISORY: Lightning & Thunderstorm Alert',
    description: 'Isolated severe lightning cells detected over South Interior Karnataka. Avoid standing near tall trees or electrical masts.',
    alert_level: 'MEDIUM',
    category: 'Thunderstorm',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    report_count: 89,
    trend_description: 'Stable report rate',
    is_active: true,
    issued_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const PublicAlertCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(FALLBACK_ALERTS);
  const [loading, setLoading] = useState(true);
  const [alertLevelFilter, setAlertLevelFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    let isSubscribed = true;
    getAlerts()
      .then((data) => {
        if (isSubscribed && data && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch((err) => console.warn('Using fallback public alerts data:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    return () => { isSubscribed = false; };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (alertLevelFilter === 'ALL') return true;
    return a.alert_level === alertLevelFilter;
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-amber-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Top Header */}
      <PublicHeader activePage="alerts" />

      {/* Header Offset */}
      <div className="h-28 shrink-0" aria-hidden="true" />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Feature Header Banner */}
        <div className="bg-[#0e172a] border border-[#1e293b] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Multi-Hazard Early Warnings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
                National Weather Alert Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Real-time disaster advisories & severe weather alerts dispatched to State Emergency Operations Centers (SEOCs) & citizens.
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#070c18] p-1.5 rounded-xl border border-[#1e293b] self-start md:self-auto">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAlertLevelFilter(lvl)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    alertLevelFilter === lvl
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Alert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className="bg-[#0e172a] border border-[#1e293b] hover:border-amber-500/40 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/10 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className={`text-xs font-extrabold font-mono tracking-wider uppercase px-2.5 py-0.5 rounded border ${getSeverityBadge(alt.alert_level)}`}>
                    {alt.alert_level} ADVISORY
                  </span>
                </div>

                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Active Warning
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">
                  {alt.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {alt.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{alt.city}, {alt.state}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {alt.trend_description}
                  </span>
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
