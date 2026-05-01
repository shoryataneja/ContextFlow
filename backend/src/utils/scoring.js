/**
 * Scoring: score = 0.5*recency + 0.3*frequency + 0.2*similarity
 */

const STALE_DAYS = parseInt(process.env.STALE_THRESHOLD_DAYS || '7', 10);

/**
 * Time-decay recency score (0–1).
 * Uses exponential decay: e^(-lambda * ageInDays)
 */
function recencyScore(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageInDays = ageMs / (1000 * 60 * 60 * 24);
  const lambda = 0.1; // decay rate
  return Math.exp(-lambda * ageInDays);
}

/**
 * Frequency score normalised to 0–1 using log scale.
 */
function frequencyScore(accessCount) {
  if (accessCount <= 0) return 0;
  return Math.min(Math.log1p(accessCount) / Math.log1p(100), 1);
}

/**
 * Keyword-based similarity score (0–1) — fallback when OpenAI is unavailable.
 */
function keywordSimilarity(content, query) {
  if (!query) return 0;
  const contentWords = new Set(content.toLowerCase().split(/\W+/).filter(Boolean));
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (!queryWords.length) return 0;
  const matches = queryWords.filter((w) => contentWords.has(w)).length;
  return matches / queryWords.length;
}

/**
 * OpenAI cosine similarity via embeddings.
 */
async function openAISimilarity(content, query) {
  try {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const [r1, r2] = await Promise.all([
      client.embeddings.create({ model: 'text-embedding-3-small', input: content }),
      client.embeddings.create({ model: 'text-embedding-3-small', input: query }),
    ]);
    const a = r1.data[0].embedding;
    const b = r2.data[0].embedding;
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const mag = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) * Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return mag ? dot / mag : 0;
  } catch {
    return null; // fallback to keyword
  }
}

async function computeSimilarity(content, query) {
  if (!query) return 0;
  // OpenAI embeddings disabled — use keyword fallback
  return keywordSimilarity(content, query);
}

async function scoreContext(ctx, query = '') {
  const r = recencyScore(ctx.createdAt);
  const f = frequencyScore(ctx.accessCount);
  const s = await computeSimilarity(ctx.content, query);
  const total = 0.5 * r + 0.3 * f + 0.2 * s;
  return {
    total: parseFloat(total.toFixed(4)),
    breakdown: {
      recencyScore: parseFloat(r.toFixed(4)),
      frequencyScore: parseFloat(f.toFixed(4)),
      similarityScore: parseFloat(s.toFixed(4)),
    },
  };
}

function isStaleByAge(createdAt) {
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > STALE_DAYS;
}

module.exports = { scoreContext, recencyScore, frequencyScore, keywordSimilarity, isStaleByAge };
