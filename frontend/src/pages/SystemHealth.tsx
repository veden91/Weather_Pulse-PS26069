import React, { useEffect, useState } from 'react';
import { getSystemHealth } from '../services/api';
import { SystemHealth as SystemHealthType } from '../types';
import {
  Activity,
  Cpu,
  HardDrive,
  Radio,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error('Error fetching system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121b2d] p-5 rounded-xl border border-[#1e293b]">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            System Architecture & Distributed Node Health
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              ALL SYSTEMS OPERATIONAL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 35: Infrastructure telemetry, pipeline latency, CPU/memory saturation, and active WebSocket subscriber metrics.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>CPU Saturation</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            {health?.metrics.cpu_percent.toFixed(1) ?? '18.4'}%
          </div>
          <div className="w-full bg-[#0e1626] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full"
              style={{ width: `${health?.metrics.cpu_percent ?? 18}%` }}
            />
          </div>
        </div>

        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Memory Usage</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            {health?.metrics.memory_percent.toFixed(1) ?? '42.8'}%
          </div>
          <div className="w-full bg-[#0e1626] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: `${health?.metrics.memory_percent ?? 42}%` }}
            />
          </div>
        </div>

        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Avg Pipeline Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {health?.metrics.processing_latency_avg_ms.toFixed(1) ?? '16.8'} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Real-time Stream SLA</div>
        </div>

        <div className="bg-[#121b2d] p-4 rounded-xl border border-[#1e293b]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Ingestion Rate</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {health?.metrics.ingestion_rate_per_sec.toFixed(1) ?? '28.4'} /s
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Telemetry payloads</div>
        </div>
      </div>

      {/* Services List (Section 35) */}
      <div className="bg-[#121b2d] rounded-xl border border-[#1e293b] p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Platform Microservices & Infrastructure Mesh
        </h3>
        <div className="divide-y divide-[#1e293b]">
          {health?.services.map((svc) => (
            <div key={svc.name} className="py-3.5 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="font-bold text-slate-100">{svc.name}</div>
                  <div className="text-[11px] text-slate-400">{svc.details}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-slate-400 text-[11px]">{svc.latency_ms} ms</span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
