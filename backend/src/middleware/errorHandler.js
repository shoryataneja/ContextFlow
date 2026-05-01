const logger = require('../config/logger');
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Prisma known errors
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Duplicate record' });
  }

  logger.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = errorHandler;
