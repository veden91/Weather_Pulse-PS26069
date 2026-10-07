import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSimulator } from '../store/simulatorContext';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { formatIngestionDate, getTimeAgo } from '../utils/dateFormatter';
import {
  Menu,
  Search,
  Bell,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  LogOut,
  Shield,
  Home,
  ChevronDown,
  Loader2,
  Layers
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);
  const { isSimulating, toggleSimulation, triggerManualPulse, isConnected, latestEvent, liveFeed } = useSimulator();
  const { user, role, quickLogin, logout, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  const currentRole = role || 'CITIZEN';
  const roleConfig = ROLE_CONFIGS[currentRole];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSwitchRole = async (targetRole: 'ADMIN' | 'ANALYST' | 'VERIFIER' | 'CITIZEN') => {
    setRoleMenuOpen(false);
    try {
      const newUser = await quickLogin(targetRole);
      const defaultRoute = ROLE_CONFIGS[newUser.role === 'VIEWER' ? 'CITIZEN' : newUser.role]?.defaultRoute || '/dashboard';
      navigate(defaultRoute);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const triggerRealTimeSync = async () => {
    setToastMsg({ text: 'Connecting to OpenWeather, IMD & Twitter streams...', type: 'loading' });
    try {
      const token = localStorage.getItem('weatherpulse_token') || localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/sources/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setToastMsg({ text: `✅ Real-time sync complete: ${data.records_ingested} live records ingested & mapped!`, type: 'success' });
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        setToastMsg({ text: '❌ Failed to sync real-time APIs (Forbidden/Error)', type: 'error' });
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setToastMsg({ text: '❌ Error connecting to server', type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const isCitizen = currentRole === 'CITIZEN';

  return (
    <div className={`flex min-h-screen antialiased font-sans ${isCitizen ? 'bg-[#000000] text-zinc-100' : 'bg-[#0b111e] text-slate-100'}`}>
      {/* Sidebar - hidden for Citizen Portal */}
      {!isCitizen && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Backdrop for mobile */}
      {!isCitizen && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className={`h-16 sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 gap-3 backdrop-blur-md border-b ${
          isCitizen ? 'bg-[#0a0a0a]/95 border-zinc-800' : 'bg-[#0e1626]/90 border-[#1e293b]'
        }`}>
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {!isCitizen ? (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg lg:hidden text-slate-400 hover:text-slate-200 hover:bg-[#152033]"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-bold tracking-wider uppercase text-white group-hover:text-emerald-400 transition-colors">
                    WeatherPulse
                  </h1>
                  <p className="text-[9px] font-medium tracking-tight text-zinc-400 font-mono">
                    CITIZEN PORTAL
                  </p>
                </div>
              </Link>
            )}

            <div className="hidden sm:block">
              {/* Removed Title texts per user request */}
            </div>
          </div>

          {/* Search bar (hidden for Citizen Portal) */}
          {!isCitizen && (
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm mx-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, cities (e.g. Lucknow, Patna)..."
                  className="w-full rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none transition-colors bg-[#121b2d] border border-[#1e293b] text-slate-100 placeholder-slate-400 focus:border-sky-500"
                />
              </div>
            </form>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Live Sync Button (Admin Only) */}
            {currentRole === 'ADMIN' ? (
              <button
                onClick={triggerRealTimeSync}
                disabled={toastMsg?.type === 'loading'}
                title="Trigger real-time synchronization from all external sources"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  toastMsg?.type === 'loading'
                    ? 'bg-indigo-600/50 text-indigo-200 border-indigo-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.3)] hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] active:scale-95'
                }`}
              >
                {toastMsg?.type === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span className="hidden xl:inline">
                  {toastMsg?.type === 'loading' ? 'Syncing...' : '⚡ Ingest Real-Time APIs'}
                </span>
              </button>
            ) : currentRole !== 'CITIZEN' ? (
              <button
                onClick={triggerManualPulse}
                title="Generate a single live report immediately"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1a2942] border border-[#1e293b] text-xs text-sky-300 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden xl:inline">Pulse</span>
              </button>
            ) : null}

            {/* Live Simulation Toggle (Admin / Analyst permitted) */}
            {currentRole !== 'CITIZEN' && (
              <button
                onClick={toggleSimulation}
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                  isSimulating
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-[#152033] text-slate-300 border-[#1e293b] hover:border-slate-600'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>SIM: {isSimulating ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Notifications Dropdown (hidden for Citizen Portal) */}
            {!isCitizen && (
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
                        liveFeed.slice(0, 15).map((item, idx) => (
                          <div key={idx} className="p-3 hover:bg-[#18233a] transition-colors">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-semibold text-sky-300">{item.event_category}</span>
                              <span className="text-slate-400 font-mono">{item.city}, {item.state}</span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">{item.text}</p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="text-sky-400 flex items-center gap-1">
                                <span>{formatIngestionDate(item.ingested_at || item.reported_at)}</span>
                                {item.ingested_at && <span className="text-slate-500">({getTimeAgo(item.ingested_at)})</span>}
                              </span>
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
            )}

            {/* RBAC Role Switcher & User Profile */}
            <div className={`relative ${isCitizen ? '' : 'pl-2 border-l border-[#1e293b]'}`}>
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all text-left border ${
                  isCitizen
                    ? 'hover:bg-zinc-800 border-transparent hover:border-zinc-700'
                    : 'hover:bg-[#152033] border-transparent hover:border-[#1e293b]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${roleConfig?.badgeBg || 'bg-sky-900/60'} ${roleConfig?.badgeColor || 'text-sky-300'} border ${roleConfig?.badgeBorder || 'border-sky-500/30'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${isCitizen ? 'text-zinc-100' : 'text-slate-200'}`}>
                    <span className="truncate max-w-[120px]">{user?.full_name || user?.username || 'Observer'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${roleConfig?.badgeColor || 'text-slate-300'}`}>
                    {currentRole}
                  </div>
                </div>
              </button>

              {roleMenuOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden border ${
                  isCitizen ? 'bg-[#0a0a0a] border-zinc-800 text-zinc-100' : 'bg-[#121b2d] border-[#1e293b]'
                }`}>
                  <div className={`px-3 py-2 border-b mb-1 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
                    <div className={`text-xs font-bold truncate ${isCitizen ? 'text-white' : 'text-slate-100'}`}>{user?.full_name || 'Active Observer'}</div>
                    <div className={`text-[11px] truncate ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>{user?.department || 'Citizen Observation Grid'}</div>
                    <div className={`text-[10px] font-mono mt-1 font-semibold ${roleConfig?.badgeColor}`}>
                      Current Role: {currentRole}
                    </div>
                  </div>
                  <div className={`mt-2 pt-2 border-t flex items-center justify-between px-2 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
                    <Link
                      to="/"
                      onClick={() => setRoleMenuOpen(false)}
                      className={`text-[11px] flex items-center gap-1 font-medium ${isCitizen ? 'text-zinc-300 hover:text-white' : 'text-sky-400 hover:text-sky-300'}`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Landing</span>
                    </Link>

                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        logout();
                        navigate('/#login');
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
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
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            toastMsg.type === 'loading'
              ? 'bg-indigo-900/80 border-indigo-500/50 text-indigo-100'
              : toastMsg.type === 'success'
              ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-900/80 border-rose-500/50 text-rose-100'
          }`}>
            {toastMsg.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
