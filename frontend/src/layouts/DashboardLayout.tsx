import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSimulator } from '../store/simulatorContext';
import {
  Menu,
  Search,
  Bell,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSimulating, toggleSimulation, triggerManualPulse, isConnected, latestEvent, liveFeed } = useSimulator();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b111e] text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0e1626]/90 backdrop-blur-md border-b border-[#1e293b] sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 gap-4">
          {/* Mobile hamburger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#152033] lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ministry of Earth Sciences (MoES)
              </span>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>WeatherPulse India</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
                  SIH 2026
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, cities (e.g. Lucknow, Patna, Cyclone)..."
                className="w-full bg-[#121b2d] border border-[#1e293b] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </form>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* WebSocket Live Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121b2d] border border-[#1e293b] text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{isConnected ? 'LIVE WS' : 'CONNECTING'}</span>
            </div>

            {/* Quick Trigger Pulse Button */}
            <button
              onClick={triggerManualPulse}
              title="Generate a single live report immediately"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1a2942] border border-[#1e293b] text-xs text-sky-300 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Pulse</span>
            </button>

            {/* Live Simulation Toggle (Section 9 & Section 47) */}
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isSimulating
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-[#152033] text-slate-300 border-[#1e293b] hover:border-slate-600'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>SIMULATION: {isSimulating ? 'ON' : 'OFF'}</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#152033] border border-transparent hover:border-[#1e293b]"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {liveFeed.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full animate-ping" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121b2d] border border-[#1e293b] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Live Ingestion Feed ({liveFeed.length})
                    </span>
                    <span className="text-[10px] text-sky-400 font-mono">Auto-Updating</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#1e293b]">
                    {liveFeed.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No live telemetry yet. Click "Pulse" or turn on "Simulation".
                      </div>
                    ) : (
                      liveFeed.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="p-3 hover:bg-[#18233a] transition-colors">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-sky-300">{item.event_category}</span>
                            <span className="text-slate-400 font-mono">{item.city}, {item.state}</span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">{item.text}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Trust: {item.trust_score}/100</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${item.verification_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {item.verification_status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Duty Officer Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#1e293b]">
              <div className="w-8 h-8 rounded-full bg-sky-900/60 border border-sky-500/30 flex items-center justify-center text-sky-300">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-200">Duty Commander</div>
                <div className="text-[10px] text-emerald-400 font-mono">MoES OPS ROOM</div>
              </div>
            </div>
          </div>
        </header>

        {/* Live Simulation Banner when active */}
        {isSimulating && (
          <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE DATA SIMULATION ACTIVE: Ingesting synthetic weather streams every 4 seconds</span>
            </div>
            {latestEvent && (
              <span className="hidden md:inline text-slate-300 truncate max-w-md">
                Latest: {latestEvent.event_category} in {latestEvent.city} (Trust: {latestEvent.trust_score}%)
              </span>
            )}
          </div>
        )}

        {/* Child Page Outlet */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
