const path = require('path');
const fs = require('fs');
const service = require('../services/context.service');
const {
  createContextSchema, updateContextSchema,
  retrieveQuerySchema, analyzeQuerySchema,
} = require('../utils/validators');
const AppError = require('../utils/AppError');

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) throw new AppError(error.message, 400, error.details);
  return value;
};

const parseBody = (body) => {
  const b = { ...body };
  if (typeof b.metadata === 'string') {
    try { b.metadata = JSON.parse(b.metadata); } catch { b.metadata = {}; }
  }
  if (typeof b.tags === 'string') {
    try { b.tags = JSON.parse(b.tags); } catch { b.tags = b.tags.split(',').map((t) => t.trim()).filter(Boolean); }
  }
  if (b.relevanceScore !== undefined) b.relevanceScore = parseFloat(b.relevanceScore);
  return b;
};

const addContext = async (req, res, next) => {
  try {
    const data = validate(createContextSchema, parseBody(req.body));
    if (req.file) {
      data.fileUrl = `/uploads/${req.file.filename}`;
      data.fileName = req.file.originalname;
      data.fileSize = req.file.size;
      data.fileMimeType = req.file.mimetype;
    }
    const ctx = await service.createContext(data);
    res.status(201).json({ success: true, data: ctx });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

const listContexts = async (req, res, next) => {
  try {
    const includeStale = req.query.includeStale === 'true';
    const contexts = await service.getAllContexts(includeStale);
    res.json({ success: true, data: contexts });
  } catch (err) {
    next(err);
  }
};

const retrieveContexts = async (req, res, next) => {
  try {
    const params = validate(retrieveQuerySchema, req.query);
    const contexts = await service.retrieveTopContexts(params);
    res.json({ success: true, data: contexts });
  } catch (err) {
    next(err);
  }
};

const analyzeContexts = async (req, res, next) => {
  try {
    const params = validate(analyzeQuerySchema, req.query);
    const result = await service.analyzeContexts(params);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getContext = async (req, res, next) => {
  try {
    const ctx = await service.getContextById(req.params.id);
    res.json({ success: true, data: ctx });
  } catch (err) {
    next(err);
  }
};

const updateContext = async (req, res, next) => {
  try {
    const data = validate(updateContextSchema, parseBody(req.body));
    if (req.file) {
      const existing = await service.getContextById(req.params.id);
      if (existing.fileUrl) fs.unlink(path.join(__dirname, '../../', existing.fileUrl), () => {});
      data.fileUrl = `/uploads/${req.file.filename}`;
      data.fileName = req.file.originalname;
      data.fileSize = req.file.size;
      data.fileMimeType = req.file.mimetype;
    }
    const ctx = await service.updateContext(req.params.id, data);
    res.json({ success: true, data: ctx });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

const deleteContext = async (req, res, next) => {
  try {
    const ctx = await service.softDeleteContext(req.params.id);
    res.json({ success: true, data: ctx, message: 'Context marked as stale' });
  } catch (err) {
    next(err);
  }
};

const explainContext = async (req, res, next) => {
  try {
    const result = await service.explainContext(req.params.id, req.query.query || '');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await service.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addContext, listContexts, retrieveContexts, analyzeContexts,
  getContext, updateContext, deleteContext, explainContext, getStats,
};
