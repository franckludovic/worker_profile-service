require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  eventBusRedisUrl: process.env.EVENT_BUS_REDIS_URL,
  cacheRedisUrl: process.env.CACHE_REDIS_URL,
};
