export const TYPE_COLORS = {
  IMMEDIATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HISTORICAL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  TEMPORAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  EXPERIENTIAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const TYPE_CHART_COLORS = {
  IMMEDIATE: '#3b82f6',
  HISTORICAL: '#f59e0b',
  TEMPORAL: '#a855f7',
  EXPERIENTIAL: '#10b981',
};

export function scoreColor(score) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

export function scoreBarColor(score) {
  if (score >= 0.7) return 'bg-emerald-500';
  if (score >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
