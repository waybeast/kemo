# CacheService Quick Reference

## Import

```javascript
const cacheService = require('./services/cacheService');
```

## Core Methods

### get(key)
```javascript
const value = await cacheService.get('mykey');
// Returns: parsed JSON object or null
```

### set(key, value, ttl)
```javascript
await cacheService.set('mykey', { data: 'value' }, 300);
// ttl in seconds, default: 300 (5 minutes)
// Returns: boolean (success)
```

### del(key)
```javascript
await cacheService.del('mykey');
// Returns: boolean (success)
```

### exists(key)
```javascript
const exists = await cacheService.exists('mykey');
// Returns: boolean
```

## Helper Methods

### buildKey(prefix, identifier)
```javascript
const key = cacheService.buildKey(
  cacheService.keyPrefixes.MOVIE, 
  '12345'
);
// Returns: 'movie:12345'
```

### delPattern(pattern)
```javascript
await cacheService.delPattern('movie:list:*');
// Deletes all keys matching pattern
// Returns: number of keys deleted
```

### incr(key, increment) / decr(key, decrement)
```javascript
await cacheService.incr('counter'); // +1
await cacheService.incr('counter', 5); // +5
await cacheService.decr('counter', 2); // -2
// Returns: new value
```

### ttl(key)
```javascript
const ttl = await cacheService.ttl('mykey');
// Returns: seconds until expiration (-1: no expiry, -2: doesn't exist)
```

### expire(key, ttl)
```javascript
await cacheService.expire('mykey', 600);
// Set new TTL for existing key
```

## Key Prefixes

```javascript
cacheService.keyPrefixes.MOVIE              // 'movie'
cacheService.keyPrefixes.MOVIE_LIST         // 'movie:list'
cacheService.keyPrefixes.USER_SESSION       // 'user:session'
cacheService.keyPrefixes.USER_PROGRESS      // 'user:progress'
cacheService.keyPrefixes.STREAMING_SOURCES  // 'streaming:sources'
cacheService.keyPrefixes.RATE_LIMIT         // 'rate:limit'
cacheService.keyPrefixes.ANALYTICS          // 'analytics'
```

## Default TTLs

```javascript
cacheService.defaultTTL.MOVIE              // 3600 (1 hour)
cacheService.defaultTTL.MOVIE_LIST         // 300 (5 minutes)
cacheService.defaultTTL.USER_SESSION       // 86400 (24 hours)
cacheService.defaultTTL.USER_PROGRESS      // 604800 (7 days)
cacheService.defaultTTL.STREAMING_SOURCES  // 3600 (1 hour)
cacheService.defaultTTL.RATE_LIMIT         // 60 (1 minute)
cacheService.defaultTTL.ANALYTICS          // 300 (5 minutes)
```

## Common Patterns

### Cache-Aside Pattern
```javascript
async function getMovie(id) {
  const key = cacheService.buildKey(cacheService.keyPrefixes.MOVIE, id);
  
  // Try cache
  let movie = await cacheService.get(key);
  if (movie) return movie;
  
  // Cache miss - get from DB
  movie = await Movie.findById(id);
  
  // Update cache
  if (movie) {
    await cacheService.set(key, movie, cacheService.defaultTTL.MOVIE);
  }
  
  return movie;
}
```

### Cache Invalidation
```javascript
async function updateMovie(id, data) {
  const movie = await Movie.findByIdAndUpdate(id, data);
  
  // Invalidate specific movie
  const key = cacheService.buildKey(cacheService.keyPrefixes.MOVIE, id);
  await cacheService.del(key);
  
  // Invalidate all movie lists
  await cacheService.delPattern('movie:list:*');
  
  return movie;
}
```

### Rate Limiting
```javascript
async function checkRateLimit(userId, limit = 100) {
  const key = `${cacheService.keyPrefixes.RATE_LIMIT}:${userId}`;
  
  const count = await cacheService.incr(key);
  
  if (count === 1) {
    // First request - set expiry
    await cacheService.expire(key, 60);
  }
  
  return count <= limit;
}
```

## Status Check

```javascript
// Check if cache is available
if (cacheService.isAvailable()) {
  // Redis is connected
} else {
  // Redis is not available - app will work without cache
}

// Get statistics
const stats = await cacheService.getStats();
console.log(stats);
```
