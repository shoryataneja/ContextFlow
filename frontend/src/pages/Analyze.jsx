import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contextApi } from '../services/api';
import { TYPE_COLORS, scoreColor, scoreBarColor, timeAgo } from '../utils/helpers';
import { Spinner, ErrorBanner } from '../components/UI';

const INSIGHT_STYLES = {
  danger:  { text: 'text-red-400',    border: 'border-red-500/40',    bg: 'bg-red-500/10',    icon: '🚨' },
  warning: { text: 'text-amber-400',  border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  icon: '⚠️' },
  caution: { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', icon: '🔔' },
  clear:   { text: 'text-emerald-400',border: 'border-emerald-500/40',bg: 'bg-emerald-500/10',icon: '✅' },
  info:    { text: 'text-slate-400',  border: 'border-slate-600',     bg: 'bg-slate-800',     icon: 'ℹ️' },
};

const CATEGORY_ICONS = {
  quality: '🔬', logistics: '🚚', payment: '💳',
  relationship: '🤝', usage: '📊', general: '📋',
};

const CATEGORY_ACCENTS = {
  quality: 'border-purple-500', logistics: 'border-amber-500',
  payment: 'border-emerald-500', relationship: 'border-pink-500',
  usage: 'border-cyan-500', general: 'border-slate-600',
};

function ContextItem({ ctx }) {
  const score = ctx.computedScore ?? ctx.relevanceScore ?? 0;
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 border border-slate-700/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border text-xs ${TYPE_COLORS[ctx.type]}`}>{ctx.type}</span>
          {ctx.entity && (
            <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">{ctx.entity}</span>
          )}
          {ctx.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="badge bg-slate-700 text-slate-400 text-xs">{tag}</span>
          ))}
          {ctx.fileUrl && <span className="text-xs text-slate-500">📎</span>}
        </div>
        <span className="text-xs text-slate-600 shrink-0">{timeAgo(ctx.createdAt)}</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{ctx.content}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${Math.min(score * 100, 100)}%` }} />
        </div>
        <span className={`text-xs font-medium shrink-0 ${scoreColor(score)}`}>{(score * 100).toFixed(1)}%</span>
        <Link to={`/contexts/${ctx.id}`} className="text-xs text-slate-500 hover:text-slate-300 shrink-0">explain →</Link>
      </div>
    </div>
  );
}

function Section({ title, icon, items, accent = 'border-slate-700' }) {
  if (!items?.length) return null;
  return (
    <div className={`card border-l-4 ${accent} space-y-3`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <span className="ml-auto text-xs text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {items.map((ctx) => <ContextItem key={ctx.id} ctx={ctx} />)}
      </div>
    </div>
  );
}

export default function Analyze() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await contextApi.analyze({ query: query.trim(), limit: 30 });
      setResult(res.data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const hasImmediate = result?.immediateContext?.length > 0;
  const hasExtended = result && Object.keys(result.extendedContext).length > 0;
  const insightStyle = INSIGHT_STYLES[result?.decisionInsight?.level] || INSIGHT_STYLES.info;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Decision Context Analyzer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Retrieves and groups your stored contexts by category to support decision-making.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <label className="block text-sm text-slate-400">Scenario / Query</label>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input flex-1"
            placeholder="Describe the scenario you want to analyze..."
            autoFocus
          />
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6 shrink-0">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {loading && <Spinner />}
      {!loading && error && <ErrorBanner message={error} />}

      {!loading && result && (
        <div className="space-y-5">

          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {result.entity && (
              <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30">{result.entity}</span>
            )}
            <span className="text-xs text-slate-500">{result.meta.totalContexts} contexts retrieved</span>
            {result.meta.negativeSignals > 0 && (
              <span className="text-xs text-red-400">{result.meta.negativeSignals} negative signal{result.meta.negativeSignals !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Decision Insight */}
          <div className={`rounded-xl border p-4 ${insightStyle.border} ${insightStyle.bg} flex items-start gap-3`}>
            <span className="text-xl shrink-0">{insightStyle.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${insightStyle.text}`}>Decision Insight</p>
              <p className="text-slate-300 text-sm mt-0.5">{result.decisionInsight.message}</p>
            </div>
          </div>

          {/* Immediate Context */}
          {hasImmediate && (
            <Section title="Immediate Context" icon="⚡" items={result.immediateContext} accent="border-blue-500" />
          )}

          {/* Extended Context grouped */}
          {hasExtended && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Extended Context</h2>
              {Object.entries(result.extendedContext).map(([slug, { label, items }]) => (
                <Section
                  key={slug}
                  title={label}
                  icon={CATEGORY_ICONS[slug] || '📋'}
                  items={items}
                  accent={CATEGORY_ACCENTS[slug] || 'border-slate-600'}
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!hasImmediate && !hasExtended && (
            <div className="card text-center py-10 text-slate-500 space-y-3">
              <p className="text-3xl">🧠</p>
              <p>No relevant contexts found.</p>
              <Link to="/add" className="btn-primary inline-block">Add Context</Link>
            </div>
          )}

          <p className="text-xs text-slate-700 text-right">
            Retrieved at {new Date(result.meta.retrievedAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      {!searched && !loading && (
        <div className="card border-dashed border-slate-700 text-center py-12 space-y-2">
          <div className="text-4xl">🧠</div>
          <p className="text-slate-400 font-medium">Enter a scenario to analyze your contexts</p>
          <p className="text-slate-600 text-sm">
            Add contexts via <Link to="/add" className="text-brand-400 hover:underline">+ Add</Link> first, then analyze them here.
          </p>
        </div>
      )}
    </div>
  );
}
