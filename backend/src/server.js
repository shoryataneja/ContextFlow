const app = require('./app');
const logger = require('./config/logger');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

async function start() {
  await prisma.$connect();
  logger.info('Database connected');

  app.listen(PORT, () => {
    logger.info(`ContextFlow API running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
