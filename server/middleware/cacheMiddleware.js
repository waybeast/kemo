const cacheService = require('../services/cacheService');

/**
 * Cache Middleware for Movie Routes
 * Implements caching for GET requests with TTL support
 */

// Cache hit/miss metrics
const metrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastReset: Date.now()
};

/**
 * Get cache metrics
 */
function getCacheMetrics() {
  const uptime = Date.now() - metrics.lastReset;
  const total = metrics.hits + metrics.misses;
  const hitRate = total > 0 ? (metrics.hits / total * 100).toFixed(2) : 0;
  
  return {
    hits: metrics.hits,
    misses: metrics.misses,
    errors: metrics.errors,
    total,
    hitRate: `${hitRate}%`,
    uptime: Math.floor(uptime / 1000) // seconds
  };
}

/**
 * Reset cache metrics
 */
function resetCacheMetrics() {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.errors = 0;
  metrics.lastReset = Date.now();
}

/**
 * Build cache key from request
 */
function buildCacheKey(req) {
  const baseKey = req.baseUrl + req.path;
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return queryString ? `${baseKey}?${queryString}` : baseKey;
}

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {string} options.keyPrefix - Cache key prefix (default: 'route')
 * @param {boolean} options.includeUser - Include user ID in cache key (default: false)
 * @returns {Function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300,
    keyPrefix = 'route',
    includeUser = false
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if cache is not available
    if (!cacheService.isAvailable()) {
      return next();
    }

    try {
      // Build cache key
      let cacheKey = `${keyPrefix}:${buildCacheKey(req)}`;
      
      // Include user ID if requested and available
      if (includeUser && req.user && req.user.id) {
        cacheKey = `${cacheKey}:user:${req.user.id}`;
      }

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Cache hit
        metrics.hits++;
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });
        
        return res.json(cachedData);
      }

      // Cache miss
      metrics.misses++;
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache the response (non-blocking)
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('Failed to cache response:', err.message);
            metrics.errors++;
          });
        }
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey
        });
        
        // Call original json method
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      metrics.errors++;
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache entries when data is modified
 */
function invalidateCacheMiddleware(patterns = []) {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Override response methods to invalidate cache after successful operations
    const invalidateCache = async () => {
      // Only invalidate on successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (!cacheService.isAvailable()) {
          return;
        }

        try {
          // Invalidate all specified patterns
          for (const pattern of patterns) {
            const deletedCount = await cacheService.delPattern(pattern);
            if (deletedCount > 0) {
              console.log(`Invalidated ${deletedCount} cache entries matching: ${pattern}`);
            }
          }
        } catch (error) {
          console.error('Cache invalidation error:', error.message);
        }
      }
    };
    
    res.json = function(data) {
      invalidateCache();
      return originalJson(data);
    };
    
    res.send = function(data) {
      invalidateCache();
      return originalSend(data);
    };
    
    next();
  };
}

/**
 * Warm cache with popular movies
 * Should be called on server startup or periodically
 */
async function warmCache() {
  if (!cacheService.isAvailable()) {
    console.log('Cache not available, skipping cache warming');
    return;
  }

  try {
    console.log('Starting cache warming...');
    
    const Movie = require('../models/Movie');
    
    // Warm cache with popular movies
    const popularMovies = await Movie.find({ isActive: true, isPopular: true })
      .sort({ views: -1 })
      .limit(20)
      .select('-streamingUrls');
    
    for (const movie of popularMovies) {
      const cacheKey = `${cacheService.keyPrefixes.MOVIE}:${movie._id}`;
      await cacheService.set(cacheKey, movie.toJSON(), cacheService.defaultTTL.MOVIE);
    }
    
    console.log(`Cache warmed with ${popularMovies.length} popular movies`);
    
    // Warm cache with featured movies
    const featuredMovies = await Movie.find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-streamingUrls');
    
    for (const movie of featuredMovies) {
      const cacheKey = `${cacheService.keyPrefixes.MOVIE}:${movie._id}`;
      await cacheService.set(cacheKey, movie.toJSON(), cacheService.defaultTTL.MOVIE);
    }
    
    console.log(`Cache warmed with ${featuredMovies.length} featured movies`);
    
    // Warm cache with latest movies
    const latestMovies = await Movie.find({ isActive: true, isLatest: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-streamingUrls');
    
    for (const movie of latestMovies) {
      const cacheKey = `${cacheService.keyPrefixes.MOVIE}:${movie._id}`;
      await cacheService.set(cacheKey, movie.toJSON(), cacheService.defaultTTL.MOVIE);
    }
    
    console.log(`Cache warmed with ${latestMovies.length} latest movies`);
    
    // Warm cache with movie lists
    const categories = ['popular', 'latest', 'featured'];
    for (const category of categories) {
      const movies = await Movie.getByCategory(category, 20);
      const cacheKey = `route:/api/movies/category/${category}?limit=20`;
      await cacheService.set(cacheKey, {
        success: true,
        data: movies,
        category
      }, cacheService.defaultTTL.MOVIE_LIST);
    }
    
    console.log('Cache warming completed successfully');
  } catch (error) {
    console.error('Cache warming error:', error.message);
  }
}

/**
 * Schedule periodic cache warming
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 */
function schedulePeriodicCacheWarming(intervalMinutes = 30) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Initial warming
  setTimeout(() => {
    warmCache();
  }, 5000); // Wait 5 seconds after server start
  
  // Periodic warming
  setInterval(() => {
    warmCache();
  }, intervalMs);
  
  console.log(`Scheduled cache warming every ${intervalMinutes} minutes`);
}

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  warmCache,
  schedulePeriodicCacheWarming,
  getCacheMetrics,
  resetCacheMetrics
};
