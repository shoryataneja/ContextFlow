import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contextApi } from '../services/api';

const TYPES = ['IMMEDIATE', 'HISTORICAL', 'TEMPORAL', 'EXPERIENTIAL'];
const CATEGORIES = ['', 'quality', 'logistics', 'payment', 'relationship', 'usage', 'general'];
const ACCEPTED = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.webp';
const MAX_MB = 10;

export default function AddContext() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    type: 'IMMEDIATE', content: '', metadata: '{}',
    relevanceScore: 0, entity: '', category: '', tags: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.content.trim()) e.content = 'Content is required';
    try { JSON.parse(form.metadata); } catch { e.metadata = 'Must be valid JSON'; }
    if (form.relevanceScore < 0 || form.relevanceScore > 1) e.relevanceScore = 'Must be between 0 and 1';
    if (file && file.size > MAX_MB * 1024 * 1024) e.file = `File must be under ${MAX_MB} MB`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return setFile(null);
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrors((p) => ({ ...p, file: `File must be under ${MAX_MB} MB` }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.file; return n; });
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await contextApi.create(
        {
          type: form.type,
          content: form.content.trim(),
          metadata: JSON.parse(form.metadata),
          relevanceScore: parseFloat(form.relevanceScore),
          entity: form.entity.trim() || null,
          category: form.category || null,
          tags,
        },
        file
      );
      toast.success('Context added!');
      navigate('/contexts');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Add Context</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">

        {/* Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select {...field('type')} className="input">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Content</label>
          <textarea {...field('content')} rows={5} className="input resize-none" placeholder="Describe the context in detail..." />
          {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
        </div>

        {/* Entity + Category row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Entity <span className="text-slate-600">(optional)</span>
            </label>
            <input {...field('entity')} className="input" placeholder="e.g. Supplier ABC" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select {...field('category')} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Auto-detect'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Tags <span className="text-slate-600">(comma-separated, optional)</span>
          </label>
          <input {...field('tags')} className="input" placeholder="e.g. invoice, payment, urgent" />
        </div>

        {/* Metadata */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Metadata (JSON)</label>
          <textarea {...field('metadata')} rows={2} className="input resize-none font-mono text-xs" />
          {errors.metadata && <p className="text-red-400 text-xs mt-1">{errors.metadata}</p>}
        </div>

        {/* Relevance Score */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Initial Relevance Score <span className="text-slate-600">(0–1)</span>
          </label>
          <input type="number" step="0.01" min="0" max="1" {...field('relevanceScore')} className="input" />
          {errors.relevanceScore && <p className="text-red-400 text-xs mt-1">{errors.relevanceScore}</p>}
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Attach Document <span className="text-slate-600">(optional)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg px-4 py-5 text-center cursor-pointer transition-colors ${
              file ? 'border-brand-500 bg-brand-500/5' : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            {file ? (
              <div className="space-y-1">
                <p className="text-sm text-brand-400 font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-slate-500 text-sm">Click to upload</p>
                <p className="text-slate-600 text-xs">PDF, Word, Excel, TXT, image — max {MAX_MB} MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden" />
          {errors.file && <p className="text-red-400 text-xs mt-1">{errors.file}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Add Context'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
