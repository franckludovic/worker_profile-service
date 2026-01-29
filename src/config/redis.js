const { createClient } = require('redis');

const config = require('./config');

let redisClient;

const connectRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: config.redisCacheUrl,
    });

    redisClient.on('error', (err) => console.error('Redis Cache Client Error', err));

    await redisClient.connect();
  }
  return redisClient;
};

module.exports = { connectRedis };
