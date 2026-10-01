import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);

  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. M. Ravichandran', role: 'ADMIN', dept: 'Ministry of Earth Sciences (MoES)', username: 'admin', email: 'admin@weatherpulse.gov.in', status: 'ACTIVE' },
    { id: 2, name: 'Dr. Mrutyunjay Mohapatra', role: 'ANALYST', dept: 'India Meteorological Department (IMD)', username: 'analyst', email: 'analyst@weatherpulse.gov.in', status: 'PENDING' },
    { id: 3, name: 'Duty Verification Officer', role: 'VERIFIER', dept: 'National Weather Watch Center', username: 'verifier', email: 'verifier@imd.gov.in', status: 'PENDING' },
    { id: 4, name: 'NDRF Control Room', role: 'VIEWER', dept: 'National Disaster Response Force', username: 'ndrf_ops', email: 'ndrf@ndma.gov.in', status: 'ACTIVE' }
  ]);

  const handleApprove = (id: number) => {
    setToastMsg({ text: 'Approving user...', type: 'loading' });
    setTimeout(() => {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'ACTIVE' } : u));
      setToastMsg({ text: '✅ User approved successfully!', type: 'success' });
      setTimeout(() => setToastMsg(null), 3000);
    }, 1000);
  };

  const handleReject = (id: number) => {
    setToastMsg({ text: 'Rejecting user...', type: 'loading' });
    setTimeout(() => {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'REJECTED' } : u));
      setToastMsg({ text: 'User access rejected.', type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Platform Administration & Access Control
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              USER APPROVALS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user roles and approve first-time access requests for Analysts and Verifiers.
          </p>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Registered Duty Officers & Authorities ({users.length})
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
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#18233a] transition-colors">
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
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    u.status === 'ACTIVE' 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : u.status === 'PENDING'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                  {u.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleApprove(u.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-400/20 rounded transition-colors"
                        title="Approve User"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleReject(u.id)}
                        className="p-1 text-rose-400 hover:bg-rose-400/20 rounded transition-colors"
                        title="Reject User"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {u.status !== 'PENDING' && (
                    <span className="text-slate-500 italic text-[10px]">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
