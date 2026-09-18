import React, { useState } from 'react';
import {
  Users,
  Shield,
  Settings,
  FileCheck,
  Activity,
  Key,
  Sliders,
  Database,
  Lock
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'config' | 'audit'>('users');

  const USERS_LIST = [
    { name: 'Dr. M. Ravichandran', role: 'ADMIN', dept: 'Ministry of Earth Sciences (MoES)', username: 'admin', email: 'admin@weatherpulse.gov.in', status: 'ACTIVE' },
    { name: 'Dr. Mrutyunjay Mohapatra', role: 'ANALYST', dept: 'India Meteorological Department (IMD)', username: 'analyst', email: 'analyst@weatherpulse.gov.in', status: 'ACTIVE' },
    { name: 'Duty Verification Officer', role: 'VERIFIER', dept: 'National Weather Watch Center', username: 'verifier', email: 'verifier@imd.gov.in', status: 'ACTIVE' },
    { name: 'NDRF Control Room', role: 'VIEWER', dept: 'National Disaster Response Force', username: 'ndrf_ops', email: 'ndrf@ndma.gov.in', status: 'ACTIVE' }
  ];

  const AUDIT_LOGS = [
    { time: '15:42 IST', user: 'admin', action: 'START_SIMULATION', details: 'Triggered live synthetic telemetry stream on 4s interval' },
    { time: '15:35 IST', user: 'verifier', action: 'VERIFY_REPORT', details: 'Promoted REP-2026-LKO001 to VERIFIED status' },
    { time: '15:10 IST', user: 'system', action: 'SPATIAL_CLUSTER', details: 'Auto-clustered 18 reports into EVT-PAT-2026-002 (Patna Flood)' },
    { time: '14:48 IST', user: 'analyst', action: 'DISPATCH_ALERT', details: 'Broadcast CRITICAL flood warning for Patna district' },
    { time: '14:02 IST', user: 'system', action: 'SOURCE_HEALTH_CHECK', details: 'All 5 ingestion adapters verified operational' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Platform Administration & Access Control
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              ROLE-BASED RBAC
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 29: User identity federation, role assignment (ADMIN, ANALYST, VERIFIER, VIEWER), audit trails, and data governance.
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-2">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeSubTab === 'users'
              ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeSubTab === 'config'
              ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Parameters</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeSubTab === 'audit'
              ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Compliance Audit Logs</span>
        </button>
      </div>

      {/* Subtab 1: User Management */}
      {activeSubTab === 'users' && (
        <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Registered Duty Officers & Authorities ({USERS_LIST.length})
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1626] border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Organization</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {USERS_LIST.map((u) => (
                <tr key={u.username} className="hover:bg-[#18233a] transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200">{u.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : u.role === 'ANALYST'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : u.role === 'VERIFIER'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{u.dept}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: System Config */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#121b2d] p-5 rounded-xl border border-[#1e293b] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Spatio-Temporal Deduplication Engine
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Max Clustering Radius (km)</label>
                <input
                  type="number"
                  defaultValue={15}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Max Clustering Time Window (Hours)</label>
                <input
                  type="number"
                  defaultValue={4}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Jaccard Semantic Overlap Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  defaultValue={0.55}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#121b2d] p-5 rounded-xl border border-[#1e293b] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI Trust Scoring Calibration Weights
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Authoritative Source Weight (Max 35)</label>
                <input
                  type="number"
                  defaultValue={35}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">NLP Model Confidence Weight (Max 25)</label>
                <input
                  type="number"
                  defaultValue={25}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Photo/Video Verification Weight (Max 15)</label>
                <input
                  type="number"
                  defaultValue={15}
                  className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-4 shadow-xl">
          <div className="space-y-2">
            {AUDIT_LOGS.map((log, idx) => (
              <div
                key={idx}
                className="bg-[#0e1626] p-3 rounded-lg border border-[#1e293b] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-[11px]">{log.time}</span>
                  <span className="font-bold text-sky-400 font-mono">[{log.user}]</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-slate-200">{log.details}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">LOGGED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
