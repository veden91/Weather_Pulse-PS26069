export const formatIngestionDate = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const getTimeAgo = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
};

export const getTimeClassification = (dateStr: string | Date | undefined): { label: string; badgeClass: string } => {
  if (!dateStr) return { label: 'Unknown', badgeClass: 'bg-slate-700/50 text-slate-300' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { label: 'Unknown', badgeClass: 'bg-slate-700/50 text-slate-300' };

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = diffMs / (1000 * 60);
  const diffHr = diffMin / 60;

  if (diffMin <= 15) {
    return { label: '⚡ Just Ingested', badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
  } else if (diffHr <= 1) {
    return { label: '🕒 Last 1 Hour', badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' };
  } else if (d.toDateString() === now.toDateString()) {
    return { label: '📅 Ingested Today', badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' };
  } else {
    return { label: '🗓️ Archived', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700' };
  }
};
