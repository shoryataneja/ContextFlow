import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { contextApi } from '../services/api';
import { useContexts } from '../hooks/useContexts';
import { TYPE_CHART_COLORS, scoreColor, timeAgo } from '../utils/helpers';
import { Spinner, ErrorBanner } from '../components/UI';

export default function Dashboard() {
  const { contexts, loading, error } = useContexts(true); // include stale for full stats
  const [stats, setStats] = useState([]);

  useEffect(() => {
    contextApi.stats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  const active = contexts.filter((c) => !c.isStale);
  const stale = contexts.filter((c) => c.isStale);
  const withDocs = contexts.filter((c) => c.fileUrl);
  const avgScore = active.length
    ? (active.reduce((s, c) => s + c.relevanceScore, 0) / active.length).toFixed(3)
    : '0.000';

  const chartData = stats.map((s) => ({ name: s.type, value: s.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <Link to="/add" className="btn-primary">+ Add Context</Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: contexts.length },
          { label: 'Active', value: active.length },
          { label: 'Stale', value: stale.length },
          { label: 'With Docs', value: withDocs.length },
          { label: 'Avg Score', value: avgScore },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-bold text-brand-500">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-300 mb-4">Context Types</h2>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={TYPE_CHART_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Recent contexts */}
        <div className="card">
          <h2 className="font-semibold text-slate-300 mb-4">Recent Active Contexts</h2>
          <div className="space-y-2">
            {active.slice(0, 6).map((ctx) => (
              <Link
                key={ctx.id}
                to={`/contexts/${ctx.id}`}
                className="flex items-center justify-between hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors group"
              >
                <div className="min-w-0 flex items-center gap-2">
                  {ctx.fileUrl && <span className="text-xs shrink-0">📎</span>}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{ctx.content}</p>
                    <p className="text-xs text-slate-600">{timeAgo(ctx.createdAt)}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ml-3 shrink-0 ${scoreColor(ctx.relevanceScore)}`}>
                  {(ctx.relevanceScore * 100).toFixed(0)}%
                </span>
              </Link>
            ))}
            {!active.length && <p className="text-slate-600 text-sm">No active contexts yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
