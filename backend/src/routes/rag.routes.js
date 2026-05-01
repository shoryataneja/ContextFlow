'use strict';

const router = require('express').Router();
const { query } = require('../controllers/rag.controller');

// POST /api/rag/query
router.post('/query', query);

module.exports = router;
