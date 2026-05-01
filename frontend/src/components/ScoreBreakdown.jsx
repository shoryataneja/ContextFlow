import { scoreBarColor, scoreColor } from '../utils/helpers';

function ScoreRow({ label, value, weight }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label} <span className="text-slate-600">({weight})</span></span>
        <span className={scoreColor(value)}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${scoreBarColor(value)}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ breakdown, finalScore }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">Score Breakdown</h3>
        <span className={`text-lg font-bold ${scoreColor(finalScore)}`}>
          {(finalScore * 100).toFixed(1)}%
        </span>
      </div>
      <ScoreRow label="Recency" value={breakdown.recencyScore} weight="50%" />
      <ScoreRow label="Frequency" value={breakdown.frequencyScore} weight="30%" />
      <ScoreRow label="Similarity" value={breakdown.similarityScore} weight="20%" />
      <p className="text-xs text-slate-600 pt-1">
        score = 0.5 × recency + 0.3 × frequency + 0.2 × similarity
      </p>
    </div>
  );
}
