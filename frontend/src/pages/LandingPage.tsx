import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { PublicHeader } from '../components/PublicHeader';
import {
  ShieldAlert,
  Twitter,
  Github,
  Mail,
  MapPin
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none"
        style={{ backgroundImage: "url('/india-weather-bg.png')" }}
      />

      {/* Background ambient lighting overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b14]/75">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      {/* Shared Public Top Navbar */}
      <PublicHeader activePage="home" />

      {/* Header Offset */}
      <div className="h-28 shrink-0" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center flex-grow">
        {/* Live Grid Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse shadow-[0_0_20px_rgba(14,165,233,0.25)]">
          <ShieldAlert className="w-4 h-4 text-sky-400" />
          <span>National Early Warning Grid Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-2xl">
          Role-Governed <br className="hidden sm:block" />
          <span className="bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400">Meteorological Analytics</span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Welcome to the "National Meteorological Intelligence & Citizen Early Warning"
          Advanced weather tracking, precision forecasting, and secure data portals for administrators, analysts, and citizens.
        </p>
      </section>

      {/* 100px Downward Offset for Footer */}
      <div className="h-[100px] shrink-0" aria-hidden="true" />

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#0a0f1a]/60 backdrop-blur-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-bold text-lg tracking-wider uppercase text-slate-100">WeatherPulse</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Empowering India with real-time meteorological insights, disaster prediction models, and a secure unified grid for all operational weather data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-4 uppercase tracking-wider text-xs">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-sky-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-sky-400 transition-colors">API Access</a></li>
                <li><a href="#" className="hover:text-sky-400 transition-colors">Public Datasets</a></li>
                <li><a href="#" className="hover:text-sky-400 transition-colors">Grid Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-4 uppercase tracking-wider text-xs">Contact</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-500" />
                  <span>support@weatherpulse.in</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span>HQ, New Delhi, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} WeatherPulse Intelligence Grid. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-500 hover:text-sky-400 transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-sky-400 transition-colors" aria-label="Github">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
