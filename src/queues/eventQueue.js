const Queue = require('bull');
const config = require('../config/config');

// Create a Bull queue for events
const eventQueue = new Queue('events', {
  redis: config.redisUrl,
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 100,    // Keep last 100 failed jobs
  },
});

module.exports = eventQueue;
