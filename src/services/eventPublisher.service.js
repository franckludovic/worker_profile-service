const eventQueue = require('../queues/eventQueue');

class EventPublisher {
  static async publishEvent(eventType, data) {
    try {
      await eventQueue.add(eventType, {
        eventType,
        timestamp: new Date().toISOString(),
        data,
      });
      console.log(`Event ${eventType} queued successfully`);
    } catch (error) {
      console.error(`Failed to queue event ${eventType}:`, error.message);
      // In production, you might want to implement retry logic or fallback
      throw error;
    }
  }
}

module.exports = EventPublisher;
