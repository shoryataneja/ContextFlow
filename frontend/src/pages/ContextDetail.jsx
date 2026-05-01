import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contextApi } from '../services/api';
import { TYPE_COLORS, timeAgo } from '../utils/helpers';
import ScoreBreakdown from '../components/ScoreBreakdown';
import DocumentPreview from '../components/DocumentPreview';
import { Spinner, ErrorBanner } from '../components/UI';

const ACCEPTED = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.webp';

export default function ContextDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [ctx, setCtx] = useState(null);
  const [explain, setExplain] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [explainLoading, setExplainLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newFile, setNewFile] = useState(null);

  useEffect(() => {
    contextApi.get(id)
      .then((r) => { setCtx(r.data); setEditContent(r.data.content); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchExplain = async () => {
    setExplainLoading(true);
    try {
      const r = await contextApi.explain(id, query);
      setExplain(r.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExplainLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const r = await contextApi.update(id, { content: editContent }, newFile || undefined);
      setCtx(r.data);
      setEditing(false);
      setNewFile(null);
      toast.success('Updated');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleStale = async () => {
    try {
      await contextApi.delete(id);
      toast.success('Marked as stale');
      navigate('/contexts');
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!ctx) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300 text-sm">
        ← Back
      </button>

      {/* Main context card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`badge border ${TYPE_COLORS[ctx.type]}`}>{ctx.type}</span>
            {ctx.isStale && <span className="badge bg-slate-700 text-slate-400">STALE</span>}
          </div>
          <span className="text-xs text-slate-500">{timeAgo(ctx.createdAt)}</span>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              className="input resize-none"
            />
            {/* Replace file */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Replace document (optional)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary text-xs"
                >
                  {newFile ? newFile.name : 'Choose file'}
                </button>
                {newFile && (
                  <button
                    type="button"
                    onClick={() => { setNewFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-xs text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                onChange={(e) => setNewFile(e.target.files[0] || null)}
                className="hidden"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="btn-primary text-xs">Save</button>
              <button onClick={() => { setEditing(false); setNewFile(null); }} className="btn-secondary text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">{ctx.content}</p>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p>Accessed: {ctx.accessCount}×</p>
          <p>Created: {new Date(ctx.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(ctx.updatedAt).toLocaleString()}</p>
        </div>

        {ctx.metadata && Object.keys(ctx.metadata).length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Metadata</p>
            <pre className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 overflow-auto">
              {JSON.stringify(ctx.metadata, null, 2)}
            </pre>
          </div>
        )}

        {!ctx.isStale && !editing && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs">Edit</button>
            <button onClick={handleStale} className="btn-danger text-xs">Mark Stale</button>
          </div>
        )}
      </div>

      {/* Document preview */}
      {ctx.fileUrl && (
        <DocumentPreview
          fileUrl={ctx.fileUrl}
          fileName={ctx.fileName}
          fileSize={ctx.fileSize}
          fileMimeType={ctx.fileMimeType}
        />
      )}

      {/* Explain scoring */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-200">Explain Scoring</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Optional: enter a query for similarity scoring"
            className="input"
          />
          <button onClick={fetchExplain} disabled={explainLoading} className="btn-primary shrink-0">
            {explainLoading ? '...' : 'Explain'}
          </button>
        </div>

        {explain && (
          <div className="space-y-4 pt-2">
            <ScoreBreakdown
              breakdown={explain.explanation.breakdown}
              finalScore={explain.explanation.finalScore}
            />
            <div className="space-y-2">
              {Object.entries(explain.explanation.reasoning).map(([key, val]) => (
                <div key={key} className="bg-slate-800 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-slate-400 capitalize mb-0.5">{key}</p>
                  <p className="text-xs text-slate-300">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
