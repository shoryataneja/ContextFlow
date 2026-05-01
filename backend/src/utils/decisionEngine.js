'use strict';

/**
 * CATEGORY CONFIG
 * Maps category slug → display label + negative signal keywords
 */
const CATEGORY_META = {
  quality:      { label: 'Quality History',      negativeKeywords: ['defect', 'reject', 'fail', 'poor', 'damage', 'complaint', 'issue', 'problem', 'fault', 'broken'] },
  logistics:    { label: 'Logistics Issues',     negativeKeywords: ['delay', 'late', 'missing', 'lost', 'wrong', 'shortage', 'backorder', 'stuck', 'undelivered'] },
  payment:      { label: 'Payment Behavior',     negativeKeywords: ['overdue', 'unpaid', 'dispute', 'chargeback', 'fraud', 'default', 'penalty', 'late payment'] },
  relationship: { label: 'Relationship History', negativeKeywords: ['escalat', 'conflict', 'terminate', 'breach', 'lawsuit', 'complaint', 'dissatisf'] },
  usage:        { label: 'Usage Patterns',       negativeKeywords: ['drop', 'decline', 'churn', 'inactive', 'cancel', 'downgrade'] },
  general:      { label: 'General Context',      negativeKeywords: [] },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

/**
 * Extract the most prominent entity from a query string.
 * Looks for capitalised multi-word tokens (e.g. "Supplier XYZ", "Customer ABC").
 * Falls back to the first noun-like token.
 */
function extractEntity(query) {
  if (!query) return null;
  // Match sequences of capitalised words (2+ chars each)
  const proper = query.match(/\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{0,})+)\b/g);
  if (proper && proper.length) return proper[0];
  // Fallback: first word longer than 3 chars
  const words = query.split(/\s+/).filter((w) => w.length > 3);
  return words[0] || null;
}

/**
 * Infer category from content + existing category field.
 */
function inferCategory(ctx) {
  if (ctx.category && ALL_CATEGORIES.includes(ctx.category)) return ctx.category;
  const text = (ctx.content + ' ' + JSON.stringify(ctx.metadata)).toLowerCase();
  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    if (slug === 'general') continue;
    if (meta.negativeKeywords.some((kw) => text.includes(kw))) return slug;
    if (text.includes(slug)) return slug;
  }
  return 'general';
}

/**
 * Check if a context carries a negative signal.
 */
function isNegative(ctx) {
  const text = ctx.content.toLowerCase();
  return Object.values(CATEGORY_META).some((meta) =>
    meta.negativeKeywords.some((kw) => text.includes(kw))
  );
}

/**
 * Build a human-readable scenario description from the query + entity.
 */
function buildScenario(query, entity, contextCount) {
  if (!query) return `Retrieving top ${contextCount} context(s) ranked by recency and frequency.`;
  const entityPart = entity ? ` related to "${entity}"` : '';
  return `Analysing decision context${entityPart} for query: "${query}". Found ${contextCount} relevant context(s).`;
}

/**
 * Generate a decision insight based on negative signal density.
 */
function buildDecisionInsight(allContexts, negativeCount) {
  const total = allContexts.length;
  if (total === 0) return { level: 'info', message: 'No context available to support a decision.' };

  const ratio = negativeCount / total;

  if (ratio >= 0.6) {
    return {
      level: 'danger',
      message: `High risk: ${negativeCount} of ${total} contexts carry negative signals. Review carefully before proceeding.`,
    };
  }
  if (ratio >= 0.3) {
    return {
      level: 'warning',
      message: `Caution: ${negativeCount} of ${total} contexts indicate potential issues. Verify before approval.`,
    };
  }
  if (negativeCount > 0) {
    return {
      level: 'caution',
      message: `Minor concerns noted in ${negativeCount} context(s). Proceed with standard due diligence.`,
    };
  }
  return {
    level: 'clear',
    message: 'No negative signals detected. Context supports proceeding with confidence.',
  };
}

/**
 * Main function: takes scored+active contexts and returns structured decision output.
 */
function buildDecisionResponse(query, scoredContexts) {
  const entity = extractEntity(query);

  // Annotate each context with inferred category
  const annotated = scoredContexts.map((ctx) => ({
    ...ctx,
    _inferredCategory: inferCategory(ctx),
    _isNegative: isNegative(ctx),
  }));

  // Split immediate vs extended
  const immediateContext = annotated.filter((c) => c.type === 'IMMEDIATE');
  const extendedRaw = annotated.filter((c) => c.type !== 'IMMEDIATE');

  // Group extended by category
  const grouped = {};
  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    const items = extendedRaw.filter((c) => c._inferredCategory === slug);
    if (items.length) grouped[slug] = { label: meta.label, items };
  }

  const negativeCount = annotated.filter((c) => c._isNegative).length;
  const decisionInsight = buildDecisionInsight(annotated, negativeCount);
  const scenario = buildScenario(query, entity, annotated.length);

  // Clean internal fields before returning
  const clean = (ctx) => {
    const { _inferredCategory, _isNegative, ...rest } = ctx;
    return { ...rest, category: _inferredCategory };
  };

  return {
    scenario,
    entity: entity || null,
    query: query || null,
    immediateContext: immediateContext.map(clean),
    extendedContext: Object.fromEntries(
      Object.entries(grouped).map(([slug, { label, items }]) => [
        slug,
        { label, items: items.map(clean) },
      ])
    ),
    decisionInsight,
    meta: {
      totalContexts: annotated.length,
      negativeSignals: negativeCount,
      retrievedAt: new Date().toISOString(),
    },
  };
}

module.exports = { buildDecisionResponse, extractEntity, inferCategory };
