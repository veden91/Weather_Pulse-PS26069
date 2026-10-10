import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, ROLE_CONFIGS } from '../store/authContext';
import {
  LayoutDashboard,
  CloudRain,
  FileText,
  Map,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Settings,
  Activity,
  SendHorizontal,
  Layers,
  ShieldAlert,
  Shield
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'VERIFIER'] },
  { name: 'Live Events', path: '/portal/events', icon: CloudRain, allowedRoles: ['ADMIN', 'VERIFIER'] },
  { name: 'Reports Explorer', path: '/reports', icon: FileText, allowedRoles: ['ADMIN', 'ANALYST', 'VERIFIER'] },
  { name: 'India Geo-Analytics', path: '/portal/map', icon: Map, allowedRoles: ['ADMIN', 'ANALYST'] },
  { name: 'Analytics & Insights', path: '/analytics', icon: BarChart3, allowedRoles: ['ADMIN', 'ANALYST'] },
  { name: 'AI Verification', path: '/verification', icon: ShieldCheck, allowedRoles: ['ADMIN', 'VERIFIER'] },
  { name: 'Alert Center', path: '/portal/alerts', icon: AlertTriangle, allowedRoles: ['ADMIN', 'VERIFIER'] },
  { name: 'Data Sources', path: '/sources', icon: Radio, allowedRoles: ['ADMIN'] },
  { name: 'Admin Panel', path: '/admin', icon: Settings, allowedRoles: ['ADMIN'] },
  { name: 'System Health', path: '/system', icon: Activity, allowedRoles: ['ADMIN'] },
  { name: 'Citizen Report', path: '/report', icon: SendHorizontal, allowedRoles: ['CITIZEN'] },
];

export const Sidebar: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { user, role, hasRole } = useAuth();
  const currentRole = role || 'CITIZEN';
  const isCitizen = currentRole === 'CITIZEN';
  const roleConfig = ROLE_CONFIGS[currentRole];

  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(currentRole);
  });

  return (
    <aside
      className={`fixed lg:static top-0 left-0 z-40 h-screen w-64 border-r flex flex-col transition-transform duration-300 ${isCitizen ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-4 border-b gap-3 ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCitizen ? 'bg-zinc-900 border border-zinc-700 text-white' : 'bg-sky-600/20 border border-sky-500/30 text-sky-400'}`}>
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className={`text-sm font-bold tracking-wider uppercase truncate ${isCitizen ? 'text-white' : 'text-slate-100'}`}>
            WeatherPulse
          </h1>
          <p className={`text-[10px] font-medium tracking-tight truncate ${isCitizen ? 'text-zinc-400 font-mono' : 'text-sky-400'}`}>
            INDIA INTELLIGENCE GRID
          </p>
        </div>
      </div>

      {/* Role Banner inside Sidebar */}
      <div className="px-3 pt-3 pb-1">
        <div className={`p-2.5 rounded-xl border ${roleConfig?.badgeBg || 'bg-[#121b2d]'} ${roleConfig?.badgeBorder || 'border-[#1e293b]'} flex items-center gap-2`}>
          <Shield className={`w-4 h-4 shrink-0 ${roleConfig?.badgeColor || 'text-slate-300'}`} />
          <div className="min-w-0 flex-1">
            <div className={`text-[10px] font-mono font-bold tracking-wider truncate ${roleConfig?.badgeColor || 'text-slate-300'}`}>
              {roleConfig?.badge || currentRole}
            </div>
            <div className={`text-[11px] font-medium truncate ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>
              {roleConfig?.title || 'Operational User'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
          <span>Permitted Modules</span>
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive
                  ? isCitizen
                    ? 'bg-zinc-800 text-white border border-zinc-600 shadow-md font-bold'
                    : 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : isCitizen
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#152033]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={`p-4 border-t ${isCitizen ? 'border-zinc-800 bg-[#050505]' : 'border-[#1e293b] bg-[#0b111e]/50'}`}>
        <div className={`flex items-center justify-end text-[11px] ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${isCitizen ? 'bg-zinc-900 text-zinc-200 border-zinc-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCitizen ? 'bg-white animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
            LIVE NODE
          </span>
        </div>
      </div>
    </aside>
  );
};
