import React from 'react';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import { UserRoleType } from '../types';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRoleType[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading, hasRole, getDefaultRoute, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b111e] flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium font-mono text-slate-400">Verifying Security Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/#login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    const currentRole = user?.role === 'VIEWER' ? 'CITIZEN' : user?.role || 'CITIZEN';
    const currentConfig = ROLE_CONFIGS[currentRole];

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#121b2d] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="text-center mb-6">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Role Access Restricted
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-3">Portal Section Unauthorized</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your active role <strong className="text-slate-200 font-mono">[{currentRole}]</strong> does not have permission to view or execute operations on this route.
            </p>
          </div>

          <div className="bg-[#0e1626] rounded-xl p-4 border border-[#1e293b] text-xs space-y-3 mb-6 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <span className="text-slate-400">Your Active Role:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${currentConfig?.badgeColor || 'text-slate-200'}`}>
                {currentConfig?.title || currentRole}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Required Role(s):</span>
              <span className="text-sky-300 font-semibold">{allowedRoles.join(' or ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(getDefaultRoute())}
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Portal</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/#login');
              }}
              className="py-2.5 px-4 rounded-xl bg-[#152033] hover:bg-[#1a2942] border border-[#1e293b] text-slate-300 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Switch Role</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
