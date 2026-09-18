import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Layers
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Events', path: '/events', icon: CloudRain },
  { name: 'Reports Explorer', path: '/reports', icon: FileText },
  { name: 'India Geo-Analytics', path: '/map', icon: Map },
  { name: 'Analytics & Insights', path: '/analytics', icon: BarChart3 },
  { name: 'AI Verification', path: '/verification', icon: ShieldCheck },
  { name: 'Alert Center', path: '/alerts', icon: AlertTriangle },
  { name: 'Data Sources', path: '/sources', icon: Radio },
  { name: 'Admin Panel', path: '/admin', icon: Settings },
  { name: 'System Health', path: '/system', icon: Activity },
  { name: 'Citizen Report', path: '/report', icon: SendHorizontal },
];

export const Sidebar: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`fixed lg:static top-0 left-0 z-40 h-screen w-64 bg-[#0e1626] border-r border-[#1e293b] flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#1e293b] gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
            WeatherPulse
          </h1>
          <p className="text-[10px] text-sky-400 font-medium tracking-tight">
            INDIA COMMAND CENTER
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Operations & Intelligence
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#152033]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1e293b] bg-[#0b111e]/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono">MoES • SIH 2026</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE NODE
          </span>
        </div>
      </div>
    </aside>
  );
};
