const Redis = require('ioredis');

let redis = null;

if (process.env.USE_REDIS === 'true') {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redis.on('error', (err) => {
    console.warn('[Redis] Connection error, caching disabled:', err.message);
    redis = null;
  });
}

const get = async (key) => {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds = 60) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
};

const del = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {}
};

module.exports = { get, set, del };
