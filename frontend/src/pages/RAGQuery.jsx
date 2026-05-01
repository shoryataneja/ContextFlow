import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ragApi } from '../services/api';
import { TYPE_COLORS, scoreColor, scoreBarColor, timeAgo } from '../utils/helpers';
import { Spinner, ErrorBanner } from '../components/UI';

const INSIGHT_STYLES = {
  danger:  { border: 'border-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-400',    icon: '🚨' },
  warning: { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  icon: '⚠️' },
  caution: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '🔔' },
  clear:   { border: 'border-emerald-500/40',bg: 'bg-emerald-500/10',text: 'text-emerald-400',icon: '✅' },
  info:    { border: 'border-slate-600',     bg: 'bg-slate-800',     text: 'text-slate-400',  icon: 'ℹ️' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
      ✨ AI Generated
    </span>
  );
}

function SummaryCard({ summary }) {
  return (
    <div className="card border-l-4 border-brand-500 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <h3 className="font-semibold text-slate-200">Summary</h3>
        <AIBadge />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
    </div>
  );
}

function RisksCard({ risks }) {
  if (!risks?.length) return null;
  return (
    <div className="card border-l-4 border-red-500 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <h3 className="font-semibold text-slate-200">Key Risks</h3>
        <AIBadge />
      </div>
      <ul className="space-y-2">
        {risks.map((risk, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-red-400 shrink-0 mt-0.5">•</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <div className="card border-l-4 border-emerald-500 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <h3 className="font-semibold text-slate-200">Recommendation</h3>
        <AIBadge />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{recommendation}</p>
    </div>
  );
}

// Fallback: shown only when Groq is unavailable — uses rule-based engine output
function FallbackResult({ result }) {
  const style = INSIGHT_STYLES[result.decisionInsight?.level] || INSIGHT_STYLES.info;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
        <span className="text-amber-400 shrink-0">⚠️</span>
        <div>
          <p className="text-xs font-semibold text-amber-400">AI Unavailable — Rule-Based Analysis</p>
          <p className="text-xs text-slate-400 mt-0.5">{result.fallbackReason}</p>
          <p className="text-xs text-slate-500 mt-1">
            Set <code className="bg-slate-800 px-1 rounded">USE_GROQ=true</code> and{' '}
            <code className="bg-slate-800 px-1 rounded">GROQ_API_KEY</code> in{' '}
            <code className="bg-slate-800 px-1 rounded">backend/.env</code>.{' '}
            Free key at{' '}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-brand-400 underline">
              console.groq.com
            </a>.
          </p>
        </div>
      </div>

      <div className="card border-l-4 border-slate-600 space-y-2">
        <p className="text-sm font-semibold text-slate-400">Scenario</p>
        <p className="text-sm text-slate-300">{result.summary}</p>
      </div>

      {result.decisionInsight && (
        <div className={`rounded-xl border p-4 ${style.border} ${style.bg} flex items-start gap-3`}>
          <span className="text-xl shrink-0">{style.icon}</span>
          <div>
            <p className={`text-sm font-semibold ${style.text}`}>Decision Signal</p>
            <p className="text-sm text-slate-300 mt-0.5">{result.decisionInsight.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UsedContextsCard({ contexts }) {
  const [expanded, setExpanded] = useState(false);
  if (!contexts?.length) return null;
  const shown = expanded ? contexts : contexts.slice(0, 2);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <h3 className="font-semibold text-slate-200">Used Contexts</h3>
          <span className="text-xs text-slate-500">{contexts.length} retrieved</span>
        </div>
        {contexts.length > 2 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-brand-400 hover:text-brand-300">
            {expanded ? 'Show less' : `Show all ${contexts.length}`}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {shown.map((ctx) => {
          const score = ctx.computedScore ?? ctx.relevanceScore ?? 0;
          return (
            <div key={ctx.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge border text-xs ${TYPE_COLORS[ctx.type]}`}>{ctx.type}</span>
                  {ctx.entity && (
                    <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">{ctx.entity}</span>
                  )}
                  {ctx.tags?.slice(0, 2).map((t) => (
                    <span key={t} className="badge bg-slate-700 text-slate-400 text-xs">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium ${scoreColor(score)}`}>{(score * 100).toFixed(0)}%</span>
                  <span className="text-xs text-slate-600">{timeAgo(ctx.createdAt)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{ctx.content}</p>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${Math.min(score * 100, 100)}%` }} />
              </div>
              <Link to={`/contexts/${ctx.id}`} className="text-xs text-slate-600 hover:text-slate-400">
                View full context →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RAGQuery() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [asked, setAsked] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ragApi.query(query.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAsked(true);
    }
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-100">RAG Decision Assistant</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ask a business question. The system retrieves your stored contexts, augments the prompt, and generates a structured answer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <label className="block text-sm text-slate-400 font-medium">Business Question</label>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input flex-1"
            placeholder="Ask anything about your stored contexts..."
            autoFocus
          />
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6 shrink-0">
            {loading ? 'Generating...' : 'Ask'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="space-y-2">
          <Spinner />
          <p className="text-center text-xs text-slate-600">Retrieving → Augmenting → Generating…</p>
        </div>
      )}

      {!loading && error && <ErrorBanner message={error} />}

      {!loading && result && (
        <div className="space-y-4">
          {result.aiGenerated ? (
            <>
              <SummaryCard summary={result.summary} />
              <RisksCard risks={result.risks} />
              <RecommendationCard recommendation={result.recommendation} />
              <UsedContextsCard contexts={result.usedContexts} />
              <p className="text-xs text-slate-700 text-right">
                ✨ Generated by Groq · {result.usedContexts?.length ?? 0} context(s) used
              </p>
            </>
          ) : (
            <>
              <FallbackResult result={result} />
              <UsedContextsCard contexts={result.usedContexts} />
            </>
          )}
        </div>
      )}

      {!asked && !loading && (
        <div className="card border-dashed border-slate-700 text-center py-12 space-y-3">
          <div className="text-4xl">🤖</div>
          <p className="text-slate-400 font-medium">Ask a question about your stored contexts</p>
          <p className="text-slate-600 text-sm">
            Add contexts first via the <Link to="/add" className="text-brand-400 hover:underline">+ Add</Link> page, then ask questions here.
          </p>
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-600">
            <span>📥 Retrieve</span>
            <span>→</span>
            <span>🔗 Augment</span>
            <span>→</span>
            <span>✨ Generate</span>
          </div>
        </div>
      )}
    </div>
  );
}
