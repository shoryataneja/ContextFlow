const Joi = require('joi');

const contextTypes = ['IMMEDIATE', 'HISTORICAL', 'TEMPORAL', 'EXPERIENTIAL'];
const categories = ['quality', 'logistics', 'payment', 'relationship', 'usage', 'general'];

const createContextSchema = Joi.object({
  type: Joi.string().valid(...contextTypes).required(),
  content: Joi.string().min(1).max(10000).required(),
  metadata: Joi.object().default({}),
  relevanceScore: Joi.number().min(0).max(1).default(0),
  entity: Joi.string().max(200).allow('', null).default(null),
  category: Joi.string().valid(...categories).allow('', null).default(null),
  tags: Joi.array().items(Joi.string().max(50)).default([]),
});

const updateContextSchema = Joi.object({
  type: Joi.string().valid(...contextTypes),
  content: Joi.string().min(1).max(10000),
  metadata: Joi.object(),
  relevanceScore: Joi.number().min(0).max(1),
  isStale: Joi.boolean(),
  entity: Joi.string().max(200).allow('', null),
  category: Joi.string().valid(...categories).allow('', null),
  tags: Joi.array().items(Joi.string().max(50)),
}).min(1);

const retrieveQuerySchema = Joi.object({
  query: Joi.string().max(500).allow('').default(''),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid(...contextTypes, '').allow('').default(''),
  includeStale: Joi.boolean().default(false),
});

const analyzeQuerySchema = Joi.object({
  query: Joi.string().max(500).allow('').default(''),
  limit: Joi.number().integer().min(1).max(50).default(20),
  entity: Joi.string().max(200).allow('').default(''),
});

module.exports = {
  createContextSchema,
  updateContextSchema,
  retrieveQuerySchema,
  analyzeQuerySchema,
};
