import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useContexts } from '../hooks/useContexts';
import ContextCard from '../components/ContextCard';
import { Spinner, EmptyState, ErrorBanner } from '../components/UI';

const TYPES = ['ALL', 'IMMEDIATE', 'HISTORICAL', 'TEMPORAL', 'EXPERIENTIAL'];

export default function ContextList() {
  const [includeStale, setIncludeStale] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasDoc, setHasDoc] = useState(false);
  const { contexts, loading, error, remove } = useContexts(includeStale);

  const filtered = useMemo(() => {
    return contexts.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      if (hasDoc && !c.fileUrl) return false;
      return true;
    });
  }, [contexts, typeFilter, dateFrom, dateTo, hasDoc]);

  const clearFilters = () => {
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setHasDoc(false);
    setIncludeStale(false);
  };

  const hasActiveFilters = typeFilter !== 'ALL' || dateFrom || dateTo || hasDoc || includeStale;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">All Contexts</h1>
        <Link to="/add" className="btn-primary">+ Add Context</Link>
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        {/* Type tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date + extra filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-36 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-36 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={hasDoc} onChange={(e) => setHasDoc(e.target.checked)} className="accent-brand-500" />
            Has document
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeStale} onChange={(e) => setIncludeStale(e.target.checked)} className="accent-brand-500" />
            Show stale
          </label>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-300 underline">
              Clear filters
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No contexts match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ctx) => (
            <ContextCard key={ctx.id} ctx={ctx} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
