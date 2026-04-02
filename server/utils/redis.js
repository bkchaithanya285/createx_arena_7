const Redis = require('ioredis');
require('dotenv').config();

let redis;

if (process.env.REDIS_URL === 'your_upstash_redis_url_here' || !process.env.REDIS_URL) {
  console.warn('⚠️ REDIS_URL not set. Using Mock Redis for local development.');
  const mockStorage = new Map();
  redis = {
    get: async (key) => mockStorage.get(key),
    set: async (key, val, ...args) => {
      mockStorage.set(key, val);
      return 'OK';
    },
    del: async (key) => mockStorage.delete(key),
    on: () => {},
    quit: async () => 'OK',
  };
} else {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

module.exports = redis;
