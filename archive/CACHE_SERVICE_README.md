# Cache Service Documentation

## Overview

The Cache Service provides a Redis-based distributed caching layer for the streaming application. It implements graceful degradation, meaning the application will continue to work even if Redis is unavailable.

## Features

- ✅ Redis connection with automatic reconnection
- ✅ Graceful degradation (app works without Redis)
- ✅ JSON serialization/deserialization
- ✅ TTL (Time To Live) support
- ✅ Key prefix organization
- ✅ Pattern-based deletion
- ✅ Increment/decrement operations
- ✅ Cache statistics
- ✅ Comprehensive error handling

## Installation

### Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

## Configuration

Add Redis configuration to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
```

**Note:** If `REDIS_URL` is not set, the service will use `REDIS_HOST` and `REDIS_PORT`.

## Usage

### Basic Operations

```javascript
const cacheService = require('./server/services/cacheService');

// Set a value with 5-minute TTL
await cacheService.set('mykey', { data: 'value' }, 300);

// Get a value
const value = await cacheService.get('mykey');

// Delete a value
await cacheService.del('mykey');

// Check if key exists
const exists = await cacheService.exists('mykey');
```

### Using Key Prefixes

```javascript
// Build a movie cache key
const movieKey = cacheService.buildKey(
  cacheService.keyPrefixes.MOVIE, 
  movieId
);

// Cache movie data with default TTL (1 hour)
await cacheService.set(
  movieKey, 
  movieData, 
  cacheService.defaultTTL.MOVIE
);

// Retrieve cached movie
const cachedMovie = await cacheService.get(movieKey);
```

### Available Key Prefixes

| Prefix | Usage | Default TTL |
|--------|-------|-------------|
| `MOVIE` | Movie metadata | 1 hour |
| `MOVIE_LIST` | Movie lists/categories | 5 minutes |
| `USER_SESSION` | User session data | 24 hours |
| `USER_PROGRESS` | Watch progress | 7 days |
| `STREAMING_SOURCES` | Streaming URLs | 1 hour |
| `RATE_LIMIT` | Rate limiting counters | 1 minute |
| `ANALYTICS` | Analytics data | 5 minutes |

### Pattern Deletion

```javascript
// Delete all movie list caches
await cacheService.delPattern('movie:list:*');

// Delete all user progress for a specific user
await cacheService.delPattern(`user:progress:${userId}:*`);
```

### Counter Operations

```javascript
// Increment view count
const views = await cacheService.incr(`movie:views:${movieId}`);

// Increment by specific amount
await cacheService.incr(`movie:views:${movieId}`, 10);

// Decrement
await cacheService.decr(`movie:views:${movieId}`);
```

### Cache Statistics

```javascript
const stats = await cacheService.getStats();
console.log(stats);
// {
//   connected: true,
//   dbSize: 42,
//   info: { redis_version: '7.0.0', uptime_in_seconds: '3600', ... }
// }
```

## Cache Key Strategy

### Naming Convention

Keys follow the pattern: `prefix:identifier[:subidentifier]`

Examples:
- `movie:12345` - Movie with ID 12345
- `movie:list:popular:1` - Popular movies page 1
- `user:session:user123` - Session for user123
- `user:progress:user123:movie456` - Progress for user123 watching movie456
- `streaming:sources:movie789` - Streaming sources for movie789

### TTL Strategy

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| Movie metadata | 1 hour | Changes infrequently |
| Movie lists | 5 minutes | Updates more often |
| User sessions | 24 hours | Active session duration |
| Watch progress | 7 days | Long-term storage |
| Streaming sources | 1 hour | URLs may expire |
| Rate limits | 1 minute | Short-term throttling |

## Error Handling

The cache service implements graceful degradation:

```javascript
// If Redis is unavailable, operations return safe defaults
const value = await cacheService.get('key'); // Returns null
const success = await cacheService.set('key', data); // Returns false
const exists = await cacheService.exists('key'); // Returns false
```

Your application should handle cache misses:

```javascript
async function getMovie(movieId) {
  // Try cache first
  const cacheKey = cacheService.buildKey(
    cacheService.keyPrefixes.MOVIE, 
    movieId
  );
  
  let movie = await cacheService.get(cacheKey);
  
  if (movie) {
    return movie; // Cache hit
  }
  
  // Cache miss - fetch from database
  movie = await Movie.findById(movieId);
  
  if (movie) {
    // Update cache for next time
    await cacheService.set(
      cacheKey, 
      movie, 
      cacheService.defaultTTL.MOVIE
    );
  }
  
  return movie;
}
```

## Testing

Run the test suite:

```bash
# Make sure Redis is running first
redis-server

# In another terminal, run the test
node test-cache-service.js
```

Expected output:
```
=== Testing CacheService ===

Test 1: Check cache availability
Cache available: true
✓ Cache is available

Test 2: Set and get a simple value
...
✓ Values match: true

...

=== All tests completed successfully! ===
```

## Integration with Express Routes

Example middleware for caching API responses:

```javascript
const cacheService = require('./services/cacheService');

// Cache middleware
function cacheMiddleware(keyPrefix, ttl = 300) {
  return async (req, res, next) => {
    // Build cache key from request
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = (data) => {
      cacheService.set(cacheKey, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
}

// Use in routes
app.get('/api/movies', 
  cacheMiddleware('movie:list', 300), 
  async (req, res) => {
    const movies = await Movie.find();
    res.json(movies);
  }
);
```

## Cache Invalidation

Invalidate cache when data changes:

```javascript
// When a movie is updated
app.put('/api/movies/:id', async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body);
  
  // Invalidate movie cache
  const movieKey = cacheService.buildKey(
    cacheService.keyPrefixes.MOVIE, 
    req.params.id
  );
  await cacheService.del(movieKey);
  
  // Invalidate all movie lists
  await cacheService.delPattern('movie:list:*');
  
  res.json(movie);
});
```

## Monitoring

Check cache health:

```javascript
app.get('/api/cache/health', async (req, res) => {
  const stats = await cacheService.getStats();
  res.json({
    status: stats.connected ? 'healthy' : 'unavailable',
    ...stats
  });
});
```

## Best Practices

1. **Always handle cache misses** - Never assume data is in cache
2. **Use appropriate TTLs** - Balance freshness vs. performance
3. **Invalidate on updates** - Keep cache consistent with database
4. **Use key prefixes** - Organize keys for easy management
5. **Monitor cache hit rates** - Optimize based on usage patterns
6. **Set reasonable TTLs** - Avoid stale data
7. **Handle Redis failures gracefully** - App should work without cache

## Troubleshooting

### Redis Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Start Redis server
```bash
redis-server
# or
sudo systemctl start redis-server
```

### Redis Authentication Failed

```
Error: NOAUTH Authentication required
```

**Solution:** Add password to `.env`
```env
REDIS_PASSWORD=your_redis_password
```

### High Memory Usage

Check Redis memory:
```bash
redis-cli info memory
```

Clear cache if needed:
```bash
redis-cli FLUSHALL
```

Or programmatically:
```javascript
await cacheService.flushAll();
```

## Performance Metrics

Expected performance improvements with caching:

- **Database queries reduced**: 70-90%
- **API response time**: 50-80% faster
- **Server load**: 40-60% reduction
- **Concurrent users supported**: 3-5x increase

## Next Steps

After implementing the cache service:

1. ✅ Task 1: Set up Redis caching layer (COMPLETE)
2. ⏭️ Task 2: Implement caching middleware for movie routes
3. ⏭️ Task 3: Set up performance monitoring with Prometheus

## Support

For issues or questions:
- Check Redis logs: `redis-cli monitor`
- View cache stats: `node test-cache-service.js`
- Review error logs in console output
