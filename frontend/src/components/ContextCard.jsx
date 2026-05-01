import { Link } from 'react-router-dom';
import { TYPE_COLORS, scoreColor, scoreBarColor, timeAgo } from '../utils/helpers';

function fileIcon(mime) {
  if (!mime) return '📄';
  if (mime === 'application/pdf') return '📕';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('word')) return '📝';
  if (mime.includes('excel') || mime.includes('spreadsheet') || mime === 'text/csv') return '📊';
  return '📄';
}

export default function ContextCard({ ctx, onDelete }) {
  const score = ctx.computedScore ?? ctx.relevanceScore;

  return (
    <div className={`card flex flex-col gap-3 ${ctx.isStale ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border ${TYPE_COLORS[ctx.type]}`}>{ctx.type}</span>
          {ctx.isStale && <span className="badge bg-slate-700 text-slate-400">STALE</span>}
          {ctx.fileUrl && (
            <span className="badge bg-slate-700/50 text-slate-400 border border-slate-700" title={ctx.fileName}>
              {fileIcon(ctx.fileMimeType)} doc
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 shrink-0">{timeAgo(ctx.createdAt)}</span>
      </div>

      <p className="text-sm text-slate-300 line-clamp-3">{ctx.content}</p>

      {/* Score bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Relevance</span>
          <span className={scoreColor(score)}>{(score * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
            style={{ width: `${Math.min(score * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-600">Accessed {ctx.accessCount}×</span>
        <div className="flex gap-2">
          <Link to={`/contexts/${ctx.id}`} className="btn-secondary text-xs py-1 px-3">
            Details
          </Link>
          {!ctx.isStale && onDelete && (
            <button onClick={() => onDelete(ctx.id)} className="btn-danger text-xs py-1 px-3">
              Stale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
