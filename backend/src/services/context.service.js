const repo = require('../repositories/context.repository');
const { scoreContext, isStaleByAge } = require('../utils/scoring');
const { buildDecisionResponse } = require('../utils/decisionEngine');
const cache = require('../config/redis');
const AppError = require('../utils/AppError');

const TOP_N = parseInt(process.env.TOP_N_CONTEXTS || '10', 10);

async function createContext(data) {
  const ctx = await repo.create(data);
  await cache.del('contexts:all:false');
  await cache.del('contexts:all:true');
  return ctx;
}

async function getAllContexts(includeStale = false) {
  const cacheKey = `contexts:all:${includeStale}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = includeStale ? {} : { isStale: false };
  const contexts = await repo.findAll(where);
  await cache.set(cacheKey, contexts, 30);
  return contexts;
}

async function _fetchScoredActive(query, type, limit) {
  const where = { isStale: false };
  if (type) where.type = type;

  const contexts = await repo.findAll(where);

  // Lifecycle: mark stale by age
  const staleIds = contexts.filter((c) => isStaleByAge(c.createdAt)).map((c) => c.id);
  if (staleIds.length) await repo.bulkMarkStale(staleIds);

  const active = contexts.filter((c) => !staleIds.includes(c.id));

  const scored = await Promise.all(
    active.map(async (ctx) => {
      const { total, breakdown } = await scoreContext(ctx, query);
      return { ...ctx, computedScore: total, breakdown };
    })
  );

  scored.sort((a, b) => {
    if (Math.abs(a.computedScore - b.computedScore) < 0.001) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return b.computedScore - a.computedScore;
  });

  return scored.slice(0, limit);
}

async function retrieveTopContexts({ query = '', limit = TOP_N, type = '' }) {
  const top = await _fetchScoredActive(query, type, limit);
  await Promise.all(top.map((c) => repo.incrementAccess(c.id)));
  return top;
}

/**
 * Structured decision-support retrieval.
 * Returns grouped, annotated response with decision insight.
 */
async function analyzeContexts({ query = '', limit = 20, entity = '' }) {
  const effectiveQuery = entity ? `${query} ${entity}`.trim() : query;
  const top = await _fetchScoredActive(effectiveQuery, '', limit);
  await Promise.all(top.map((c) => repo.incrementAccess(c.id)));
  return buildDecisionResponse(effectiveQuery, top);
}

async function getContextById(id) {
  const ctx = await repo.findById(id);
  if (!ctx) throw new AppError('Context not found', 404);
  return ctx;
}

async function updateContext(id, data) {
  await getContextById(id);
  const updated = await repo.update(id, data);
  await cache.del('contexts:all:false');
  await cache.del('contexts:all:true');
  return updated;
}

async function softDeleteContext(id) {
  await getContextById(id);
  const updated = await repo.markStale(id);
  await cache.del('contexts:all:false');
  await cache.del('contexts:all:true');
  return updated;
}

async function explainContext(id, query = '') {
  const ctx = await repo.findById(id);
  if (!ctx) throw new AppError('Context not found', 404);

  const { total, breakdown } = await scoreContext(ctx, query);
  const staleByAge = isStaleByAge(ctx.createdAt);

  return {
    context: ctx,
    explanation: {
      finalScore: total,
      breakdown,
      reasoning: {
        recency: `Score ${breakdown.recencyScore.toFixed(3)}: context is ${Math.round((Date.now() - new Date(ctx.createdAt)) / 86400000)} day(s) old. Higher = more recent.`,
        frequency: `Score ${breakdown.frequencyScore.toFixed(3)}: accessed ${ctx.accessCount} time(s). Higher = more frequently used.`,
        similarity: `Score ${breakdown.similarityScore.toFixed(3)}: ${query ? `keyword/semantic match against "${query}"` : 'no query provided, defaulted to 0'}.`,
        staleStatus: staleByAge
          ? 'This context exceeds the stale threshold and would be excluded from retrieval.'
          : 'This context is within the active memory window.',
      },
    },
  };
}

async function getStats() {
  const typeCounts = await repo.countByType();
  return typeCounts.map((t) => ({ type: t.type, count: t._count._all }));
}

module.exports = {
  createContext, getAllContexts, retrieveTopContexts, analyzeContexts,
  getContextById, updateContext, softDeleteContext, explainContext, getStats,
};
