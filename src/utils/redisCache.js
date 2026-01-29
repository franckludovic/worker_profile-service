class RedisCache {
  constructor(redisClient, defaultTtl = 300) { // 5 minutes default
    this.redis = redisClient;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null if not found
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {string|object} value - Value to cache (will be JSON.stringified if object)
   * @param {number} ttl - Time to live in seconds (optional, uses default if not provided)
   * @returns {Promise<boolean>} - True if successful
   */
  async set(key, value, ttl = null) {
    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const expiry = ttl || this.defaultTtl;

      const result = await this.redis.setex(key, expiry, serializedValue);
      return result === 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<number>} - Number of keys deleted
   */
  async del(key) {
    try {
      return await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if key exists
   */
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple key-value pairs
   * @param {Object} keyValuePairs - Object with keys and values
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - True if all successful
   */
  async mset(keyValuePairs, ttl = null) {
    try {
      const pipeline = this.redis.multi();
      const expiry = ttl || this.defaultTtl;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        pipeline.setex(key, expiry, serializedValue);
      }

      const results = await pipeline.exec();
      return results.every(([err, result]) => !err && result === 'OK');
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<(string|null)[]>} - Array of values (null if not found)
   */
  async mget(keys) {
    try {
      const values = await this.redis.mget(keys);
      return values;
    } catch (error) {
      console.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Set value only if key doesn't exist
   * @param {string} key - Cache key
   * @param {string|object} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - True if set, false if key already exists
   */
  async setnx(key, value, ttl = null) {
    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const expiry = ttl || this.defaultTtl;

      const result = await this.redis.set(key, serializedValue, 'NX', 'EX', expiry);
      return result === 'OK';
    } catch (error) {
      console.error('Cache setnx error:', error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   * @param {string} key - Cache key
   * @returns {Promise<number>} - New value after increment
   */
  async incr(key) {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds (-2 if key doesn't exist, -1 if no expiry)
   */
  async ttl(key) {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -2;
    }
  }

  /**
   * Extend TTL for a key
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in seconds
   * @returns {Promise<boolean>} - True if successful
   */
  async expire(key, ttl) {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Clear all cache keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., "user:*")
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clearPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.redis.del(keys);
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    try {
      const info = await this.redis.info('stats');
      // Parse relevant stats from Redis INFO command
      const stats = {};
      const lines = info.split('\n');

      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      }

      return {
        total_connections_received: stats.total_connections_received,
        total_commands_processed: stats.total_commands_processed,
        instantaneous_ops_per_sec: stats.instantaneous_ops_per_sec,
        keyspace_hits: stats.keyspace_hits,
        keyspace_misses: stats.keyspace_misses,
        used_memory: stats.used_memory,
        used_memory_peak: stats.used_memory_peak
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {};
    }
  }
}

module.exports = RedisCache;
