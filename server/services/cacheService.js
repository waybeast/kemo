const redis = require('redis');
const { 
  recordCacheHit, 
  recordCacheMiss, 
  recordCacheOperation 
} = require('../middleware/metricsMiddleware');

/**
 * CacheService - Redis-based caching layer
 * Provides distributed caching with TTL support and graceful degradation
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    
    // Cache key prefixes for organization
    this.keyPrefixes = {
      MOVIE: 'movie',
      MOVIE_LIST: 'movie:list',
      USER_SESSION: 'user:session',
      USER_PROGRESS: 'user:progress',
      STREAMING_SOURCES: 'streaming:sources',
      RATE_LIMIT: 'rate:limit',
      ANALYTICS: 'analytics'
    };

    // Default TTL values (in seconds)
    this.defaultTTL = {
      MOVIE: 3600,           // 1 hour
      MOVIE_LIST: 300,       // 5 minutes
      USER_SESSION: 86400,   // 24 hours
      USER_PROGRESS: 604800, // 7 days
      STREAMING_SOURCES: 3600, // 1 hour
      RATE_LIMIT: 60,        // 1 minute
      ANALYTICS: 300         // 5 minutes
    };

    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Check if Redis is configured
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
      
      if (!redisUrl) {
        console.warn('Redis not configured. Caching will be disabled.');
        return;
      }

      // Create Redis client
      const clientConfig = {
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              console.error('Redis max retries exceeded. Caching disabled.');
              return new Error('Max retries exceeded');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
            return Math.min(retries * 100, 3000);
          }
        }
      };

      // Handle different Redis URL formats
      if (redisUrl.startsWith('redis://')) {
        clientConfig.url = redisUrl;
      } else {
        clientConfig.socket.host = process.env.REDIS_HOST || 'localhost';
        clientConfig.socket.port = parseInt(process.env.REDIS_PORT || '6379');
        if (process.env.REDIS_PASSWORD) {
          clientConfig.password = process.env.REDIS_PASSWORD;
        }
      }

      this.client = redis.createClient(clientConfig);

      // Event handlers
      this.client.on('connect', () => {
        console.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis client connected and ready');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.retryAttempts++;
        console.log(`Redis client reconnecting... (attempt ${this.retryAttempts})`);
      });

      // Connect to Redis
      await this.client.connect();
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.isConnected && this.client && this.client.isOpen;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - Parsed value or null
   */
  async get(key) {
    if (!this.isAvailable()) {
      return null;
    }

    const start = Date.now();
    try {
      const value = await this.client.get(key);
      const duration = (Date.now() - start) / 1000;
      
      // Extract key pattern for metrics
      const keyPattern = this.extractKeyPattern(key);
      
      if (!value) {
        recordCacheMiss('redis', keyPattern);
        recordCacheOperation('get', 'redis', duration);
        return null;
      }
      
      recordCacheHit('redis', keyPattern);
      recordCacheOperation('get', 'redis', duration);
      return JSON.parse(value);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error.message);
      const duration = (Date.now() - start) / 1000;
      recordCacheOperation('get', 'redis', duration);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = 300) {
    if (!this.isAvailable()) {
      return false;
    }

    const start = Date.now();
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      const duration = (Date.now() - start) / 1000;
      recordCacheOperation('set', 'redis', duration);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error.message);
      const duration = (Date.now() - start) / 1000;
      recordCacheOperation('set', 'redis', duration);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    if (!this.isAvailable()) {
      return false;
    }

    const start = Date.now();
    try {
      await this.client.del(key);
      const duration = (Date.now() - start) / 1000;
      recordCacheOperation('delete', 'redis', duration);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error.message);
      const duration = (Date.now() - start) / 1000;
      recordCacheOperation('delete', 'redis', duration);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Existence status
   */
  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., 'movie:list:*')
   * @returns {Promise<number>} - Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Get remaining TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
   */
  async ttl(key) {
    if (!this.isAvailable()) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error.message);
      return -2;
    }
  }

  /**
   * Increment a numeric value in cache
   * @param {string} key - Cache key
   * @param {number} increment - Amount to increment (default: 1)
   * @returns {Promise<number|null>} - New value or null
   */
  async incr(key, increment = 1) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      if (increment === 1) {
        return await this.client.incr(key);
      } else {
        return await this.client.incrBy(key, increment);
      }
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Decrement a numeric value in cache
   * @param {string} key - Cache key
   * @param {number} decrement - Amount to decrement (default: 1)
   * @returns {Promise<number|null>} - New value or null
   */
  async decr(key, decrement = 1) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      if (decrement === 1) {
        return await this.client.decr(key);
      } else {
        return await this.client.decrBy(key, decrement);
      }
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set expiration time for a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async expire(key, ttl) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Flush all cache data (use with caution!)
   * @returns {Promise<boolean>} - Success status
   */
  async flushAll() {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client.flushAll();
      console.log('Cache flushed successfully');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} - Cache statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        connected: false,
        error: 'Cache not available'
      };
    }

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbSize();
      
      return {
        connected: true,
        dbSize,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      console.error('Cache stats error:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Redis INFO command output
   * @param {string} info - Redis INFO output
   * @returns {object} - Parsed info
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = value;
        }
      }
    });
    
    return parsed;
  }

  /**
   * Build cache key with prefix
   * @param {string} prefix - Key prefix
   * @param {string} identifier - Unique identifier
   * @returns {string} - Full cache key
   */
  buildKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  /**
   * Extract key pattern for metrics (e.g., 'movie:123' -> 'movie')
   * @param {string} key - Full cache key
   * @returns {string} - Key pattern
   */
  extractKeyPattern(key) {
    const parts = key.split(':');
    if (parts.length >= 2) {
      return parts[0] + ':' + parts[1];
    }
    return parts[0] || 'unknown';
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
