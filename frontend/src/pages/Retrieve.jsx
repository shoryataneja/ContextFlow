import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRetrieve } from '../hooks/useContexts';
import { Spinner, EmptyState, ErrorBanner } from '../components/UI';
import { TYPE_COLORS, scoreColor, scoreBarColor, timeAgo } from '../utils/helpers';

const TYPES = ['', 'IMMEDIATE', 'HISTORICAL', 'TEMPORAL', 'EXPERIENTIAL'];

function RetrievedCard({ ctx, rank }) {
  const score = ctx.computedScore ?? ctx.relevanceScore ?? 0;
  const breakdown = ctx.breakdown;

  return (
    <div className="card space-y-3 relative">
      <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shadow">
        {rank}
      </div>

      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border ${TYPE_COLORS[ctx.type]}`}>{ctx.type}</span>
          {ctx.entity && (
            <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">{ctx.entity}</span>
          )}
          {ctx.fileUrl && <span className="badge bg-slate-700/50 text-slate-400 border border-slate-700">📎 doc</span>}
        </div>
        <span className="text-xs text-slate-500 shrink-0">{timeAgo(ctx.createdAt)}</span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{ctx.content}</p>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500 font-medium">Relevance Score</span>
          <span className={`font-bold ${scoreColor(score)}`}>{(score * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${Math.min(score * 100, 100)}%` }} />
        </div>
      </div>

      {breakdown && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Recency', value: breakdown.recencyScore, weight: '50%' },
            { label: 'Frequency', value: breakdown.frequencyScore, weight: '30%' },
            { label: 'Similarity', value: breakdown.similarityScore, weight: '20%' },
          ].map(({ label, value, weight }) => (
            <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
              <div className={`text-sm font-bold ${scoreColor(value)}`}>{(value * 100).toFixed(0)}%</div>
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xs text-slate-700">{weight}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-600">Accessed {ctx.accessCount}×</span>
        <Link to={`/contexts/${ctx.id}`} className="btn-secondary text-xs py-1 px-3">
          Details & Explain
        </Link>
      </div>
    </div>
  );
}

export default function Retrieve() {
  const { results, loading, error, searched, retrieve } = useRetrieve();
  const [params, setParams] = useState({ query: '', limit: 5, type: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    retrieve({ ...params, limit: parseInt(params.limit, 10) || 5 });
  };

  const set = (key) => (e) => setParams((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Intelligent Retrieval</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ranked by: 0.5 × recency + 0.3 × frequency + 0.2 × similarity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-xs text-slate-500 mb-1">Query</label>
            <input
              value={params.query}
              onChange={set('query')}
              className="input"
              placeholder="Search your contexts..."
              autoFocus
            />
          </div>
          <div className="w-40">
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select value={params.type} onChange={set('type')} className="input">
              {TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-slate-500 mb-1">Top N</label>
            <input type="number" min={1} max={50} value={params.limit} onChange={set('limit')} className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading ? 'Retrieving...' : 'Retrieve'}
          </button>
        </div>
      </form>

      {loading && <Spinner />}
      {!loading && error && <ErrorBanner message={error} />}

      {!loading && searched && !error && results.length === 0 && (
        <EmptyState message="No active contexts found." />
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{results.length}</span> result{results.length !== 1 ? 's' : ''}
            {params.query && <span className="text-slate-500"> for "{params.query}"</span>}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((ctx, i) => (
              <RetrievedCard key={ctx.id} ctx={ctx} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="card border-dashed border-slate-700 text-center py-10 space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="text-slate-400 font-medium">Enter a query to retrieve your contexts</p>
          <p className="text-slate-600 text-sm">
            Add contexts via <Link to="/add" className="text-brand-400 hover:underline">+ Add</Link> first.
          </p>
        </div>
      )}
    </div>
  );
}
