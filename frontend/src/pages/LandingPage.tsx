import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { Layers, ArrowRight, LogIn, ShieldAlert, Twitter, Github, Mail, MapPin } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, role, logout, getDefaultRoute } = useAuth();
  const navigate = useNavigate();



  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/india-weather-bg.png')" }}
      />
      
      {/* Background ambient lighting overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b14]/60">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0e1626]/85 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto py-3 md:h-16 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-[#0b111e] rounded-[10px] flex items-center justify-center text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <span className="font-bold text-sm tracking-wider uppercase text-slate-100">WeatherPulse</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 relative">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={() => navigate(getDefaultRoute())}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Open {ROLE_CONFIGS[role || 'ADMIN']?.title || 'Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1a2942] border border-[#1e293b] text-slate-300 text-xs font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-sky-600/25 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Creative Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center flex-grow">
        {/* Glowing live indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <ShieldAlert className="w-4 h-4" />
          <span>Live Grid Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-2xl">
          Role-Governed <br className="hidden sm:block" />
          <span className="bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Meteorological Analytics</span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Welcome to the National Meteorological Intelligence & Citizen Early Warning Grid.
          Advanced weather tracking, precision forecasting, and secure data portals for administrators, analysts, and citizens.
        </p>

        {!isAuthenticated && (
          <button
            onClick={() => navigate('/login')}
            className="mt-10 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] transition-all flex items-center gap-3 hover:scale-105 active:scale-95 group"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </section>

      {/* Rich Creative Footer Section */}
      <footer className="relative z-10 mt-auto border-t border-slate-800/50 bg-[#0a0f1a]/80 backdrop-blur-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5">
                  <div className="w-full h-full bg-[#0b111e] rounded-[6px] flex items-center justify-center text-sky-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
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
