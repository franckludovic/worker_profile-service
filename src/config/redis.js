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

// Initialize Redis client on module load
let initializedClient;
const getRedisClient = async () => {
  if (!initializedClient) {
    initializedClient = await connectRedis();
  }
  return initializedClient;
};

// Export the client promise
module.exports = getRedisClient;
