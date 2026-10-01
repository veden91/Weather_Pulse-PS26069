import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { Layers, LogIn, User, Key, Lock, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'ANALYST' | 'VERIFIER' | 'CITIZEN'>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleRoleTabChange = (targetRole: 'ADMIN' | 'ANALYST' | 'VERIFIER' | 'CITIZEN') => {
    setSelectedRole(targetRole);
    setErrorMsg(null);
    const cfg = ROLE_CONFIGS[targetRole];
    if (cfg) {
      setUsername(cfg.demoUsername);
      setPassword(cfg.demoPassword);
    }
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      const defaultRoute = ROLE_CONFIGS[loggedUser.role === 'VIEWER' ? 'CITIZEN' : loggedUser.role]?.defaultRoute || '/dashboard';
      navigate(defaultRoute);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeConfig = ROLE_CONFIGS[selectedRole];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col relative items-center justify-center">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/india-weather-bg.png')" }}
      />
      
      {/* Background ambient lighting overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b14]/70">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-8 left-8 z-10 cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-[#0b111e] rounded-[10px] flex items-center justify-center text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <span className="font-bold text-sm tracking-wider uppercase text-slate-100">WeatherPulse</span>
      </div>

      <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto">
        <div className="bg-[#0e1626]/90 border border-[#1e293b] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle glow border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Unified Security Gateway
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-3">{isRegisterMode ? 'Register Account' : 'Portal Access & Login'}</h2>
            <p className="text-xs text-slate-400 mt-2">
              Select your role or enter credentials to access your designated portal with verified permissions.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-1 bg-[#090e18] p-1.5 rounded-xl border border-[#1e293b]">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className={`px-6 py-2 text-sm rounded-lg font-bold transition-all ${!isRegisterMode ? 'bg-sky-600 shadow-md text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d]'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className={`px-6 py-2 text-sm rounded-lg font-bold transition-all ${isRegisterMode ? 'bg-emerald-600 shadow-md text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d]'}`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 bg-[#090e18] p-1.5 rounded-xl border border-[#1e293b]">
            {(['ADMIN', 'ANALYST', 'VERIFIER', 'CITIZEN'] as const).map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleTabChange(r)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `${cfg.badgeBg} ${cfg.badgeColor} border ${cfg.badgeBorder} shadow-lg`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d]'
                  }`}
                >
                  <span>{r}</span>
                  <span className="text-[10px] font-normal opacity-80">{cfg.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginFormSubmit} className="max-w-md mx-auto space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#090e18] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#090e18] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
              <span>Demo Credential for {selectedRole}:</span>
              <span className="text-sky-300">{activeConfig.demoUsername} / {activeConfig.demoPassword}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 ${isRegisterMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/25' : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-xl shadow-sky-600/25'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  {isRegisterMode ? <User className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{isRegisterMode ? `Register as ${activeConfig.title}` : `Access ${activeConfig.title}`}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
