'use strict';

const contextService = require('./context.service');
const { buildDecisionResponse } = require('../utils/decisionEngine');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const RAG_CONTEXT_LIMIT = 5;
const OPENAI_TIMEOUT_MS = 25000;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildContextBlock(contexts) {
  return contexts
    .map((ctx, i) => {
      const meta = [];
      if (ctx.entity) meta.push(`entity: ${ctx.entity}`);
      if (ctx.category) meta.push(`category: ${ctx.category}`);
      if (ctx.tags?.length) meta.push(`tags: ${ctx.tags.join(', ')}`);
      const metaStr = meta.length ? ` (${meta.join(' | ')})` : '';
      return `${i + 1}. [${ctx.type}${metaStr}]\n   ${ctx.content}`;
    })
    .join('\n\n');
}

function buildPrompt(query, contextBlock) {
  return `You are a business decision assistant with expertise in risk assessment and operational analysis.

Based ONLY on the context provided below, answer the business question. Do not invent facts.

CONTEXT:
${contextBlock}

QUESTION:
${query}

Respond in this exact JSON format (no markdown, no code fences, raw JSON only):
{
  "summary": "2-3 sentence overview of the situation based on the context",
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendation": "Clear, actionable recommendation based on the evidence"
}`;
}

// ─── Groq caller ─────────────────────────────────────────────────────────────

async function callLLM(prompt) {
  const Groq = require('groq-sdk');
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      },
      { signal: controller.signal }
    );
    return response.choices[0].message.content.trim();
  } finally {
    clearTimeout(timer);
  }
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseAIResponse(raw) {
  // Strip markdown code fences if model wraps output anyway
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.summary || !parsed.recommendation) {
    throw new Error('Incomplete AI response structure');
  }

  return {
    summary: String(parsed.summary).trim(),
    risks: Array.isArray(parsed.risks)
      ? parsed.risks.map((r) => String(r).trim()).filter(Boolean)
      : [],
    recommendation: String(parsed.recommendation).trim(),
  };
}

// ─── Fallback builder ─────────────────────────────────────────────────────────

function buildFallback(query, contexts, reason) {
  const decisionData = buildDecisionResponse(query, contexts);
  return {
    aiGenerated: false,
    fallbackReason: reason,
    summary: decisionData.scenario,
    risks: contexts
      .filter((c) => {
        const t = c.content.toLowerCase();
        return ['defect', 'delay', 'overdue', 'dispute', 'fail', 'issue', 'problem', 'risk', 'complaint'].some((kw) => t.includes(kw));
      })
      .slice(0, 3)
      .map((c) => c.content.slice(0, 120)),
    recommendation: decisionData.decisionInsight.message,
    usedContexts: contexts,
    decisionInsight: decisionData.decisionInsight,
  };
}

// ─── Main RAG function ────────────────────────────────────────────────────────

async function generateAnswer(query) {
  if (!query || !query.trim()) {
    throw new AppError('Query is required', 400);
  }

  // Step 1: Retrieve top-N scored contexts
  const contexts = await contextService.retrieveTopContexts({
    query: query.trim(),
    limit: RAG_CONTEXT_LIMIT,
  });

  logger.debug(`[RAG] Retrieved ${contexts.length} contexts for query: "${query}"`);

  if (!contexts.length) {
    return {
      aiGenerated: false,
      fallbackReason: 'No contexts found in the knowledge base.',
      summary: 'No relevant context is available to answer this question.',
      risks: [],
      recommendation: 'Add relevant context entries before querying.',
      usedContexts: [],
      decisionInsight: { level: 'info', message: 'No context available.' },
    };
  }

  // Step 2: Check if Groq is configured
  const groqEnabled = process.env.USE_GROQ === 'true' && process.env.GROQ_API_KEY;

  if (!groqEnabled) {
    logger.debug('[RAG] Groq not configured — using rule-based fallback');
    return buildFallback(query, contexts, 'AI unavailable — showing retrieved context analysis only.');
  }

  // Step 3: Build prompt
  const contextBlock = buildContextBlock(contexts);
  const prompt = buildPrompt(query.trim(), contextBlock);

  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';
  logger.debug(`[RAG] Sending prompt to Groq/${model} (${contexts.length} contexts, ${prompt.length} chars)`);

  // Step 4: Call Groq with timeout + error handling
  let rawResponse;
  try {
    rawResponse = await callLLM(prompt);
  } catch (err) {
    const reason = err.name === 'AbortError'
      ? 'Groq request timed out after 25s.'
      : `Groq error: ${err.message}`;
    logger.warn(`[RAG] Groq call failed: ${reason}`);
    return buildFallback(query, contexts, reason);
  }

  // Step 5: Parse structured response
  let parsed;
  try {
    parsed = parseAIResponse(rawResponse);
  } catch (err) {
    logger.warn(`[RAG] Failed to parse AI response: ${err.message}\nRaw: ${rawResponse}`);
    return buildFallback(query, contexts, 'AI response could not be parsed — showing rule-based analysis.');
  }

  logger.debug('[RAG] Successfully generated AI answer');

  // Step 6: Return full structured response
  const decisionData = buildDecisionResponse(query, contexts);

  return {
    aiGenerated: true,
    fallbackReason: null,
    summary: parsed.summary,
    risks: parsed.risks,
    recommendation: parsed.recommendation,
    usedContexts: contexts,
    decisionInsight: decisionData.decisionInsight,
  };
}

module.exports = { generateAnswer };
