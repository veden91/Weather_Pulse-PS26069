import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { Layers, CloudRain, AlertTriangle, Map, ArrowRight } from 'lucide-react';

const ROLE_INITIALS: Record<string, { initials: string; bg: string }> = {
  ADMIN: { initials: 'AM', bg: 'linear-gradient(135deg, #1e2f70 0%, #0D1C42 100%)' },
  ANALYST: { initials: 'AL', bg: 'linear-gradient(135deg, #0f3468 0%, #0D1C42 100%)' },
  VERIFIER: { initials: 'VR', bg: 'linear-gradient(135deg, #162e5c 0%, #0D1C42 100%)' },
  CITIZEN: { initials: 'CT', bg: 'linear-gradient(135deg, #0e2f50 0%, #0D1C42 100%)' },
};

export const PublicHeader: React.FC<{ activePage?: 'events' | 'alerts' | 'map' | 'home' }> = ({ activePage }) => {
  const { isAuthenticated, role, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-[36px] left-4 right-4 md:left-[40px] md:right-[40px] lg:left-[60px] lg:right-[60px] z-50 bg-[#0D1C42]/90 backdrop-blur-md border border-[#1e293b] rounded-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0b111e] rounded-[6px] flex items-center justify-center text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="font-bold text-sm tracking-wider uppercase text-slate-100 group-hover:text-sky-400 transition-colors hidden sm:inline">
            WeatherPulse
          </span>
        </div>

        {/* Center: Feature Navigation Buttons */}
        <nav className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto py-1">
          <button
            onClick={() => navigate('/events')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap group ${
              activePage === 'events'
                ? 'bg-transparent text-sky-400 border-2 border-sky-400'
                : 'bg-transparent text-slate-300 hover:text-sky-400 border-2 border-transparent'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-sky-400 group-hover:animate-bounce shrink-0" />
            <span>Live Events</span>
          </button>

          <button
            onClick={() => navigate('/alerts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap group ${
              activePage === 'alerts'
                ? 'bg-transparent text-amber-400 border-2 border-amber-400'
                : 'bg-transparent text-slate-300 hover:text-amber-400 border-2 border-transparent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 group-hover:animate-pulse shrink-0" />
            <span>Alert Center</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap group ${
              activePage === 'map'
                ? 'bg-transparent text-emerald-400 border-2 border-emerald-400'
                : 'bg-transparent text-slate-300 hover:text-emerald-400 border-2 border-transparent'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            <span>India Geo-Analytics</span>
          </button>
        </nav>

        {/* Right: Auth & Navigation Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {role && ROLE_INITIALS[role] && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 hidden sm:flex"
                  style={{
                    background: ROLE_INITIALS[role].bg,
                    outline: '1.5px solid rgba(255,255,255,0.2)',
                  }}
                  title={ROLE_CONFIGS[role]?.title || role}
                >
                  <span className="text-slate-100 text-[9px] font-extrabold tracking-widest select-none">
                    {ROLE_INITIALS[role].initials}
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate(getDefaultRoute())}
                className="px-4 py-1.5 rounded-full bg-transparent border-2 border-white hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 group"
              >
                <span>Portal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 rounded-full bg-transparent border-2 border-white hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
