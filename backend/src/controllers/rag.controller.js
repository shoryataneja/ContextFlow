'use strict';

const ragService = require('../services/rag.service');
const AppError = require('../utils/AppError');

const query = async (req, res, next) => {
  try {
    const { query: q } = req.body;
    if (!q || !String(q).trim()) {
      throw new AppError('query field is required', 400);
    }
    const result = await ragService.generateAnswer(String(q).trim());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { query };
