# Scalable Streaming Architecture - Design Document

## Overview

This design document outlines the transformation of the current monolithic streaming service into a scalable, distributed architecture capable of handling thousands of concurrent users. The design is inspired by Netflix's architecture and focuses on practical, incremental improvements that can be implemented in a hobby project while teaching core scalability concepts.

### Current Architecture

The existing system is a traditional MERN stack application with:
- Single Express.js server handling all requests
- Direct MongoDB queries without caching
- Synchronous request processing
- No load balancing or horizontal scaling
- Static rate limiting
- Third-party streaming provider integration (VidSrc, Embed.su, etc.)

### Target Architecture (MERN-Compatible Enhancement)

**Important**: This design enhances your existing MERN stack, not replaces it. All improvements are incremental and backward-compatible:

- **MongoDB**: Remains your primary database, we add read replicas and connection pooling
- **Express.js**: Your existing Express routes stay the same, we add middleware layers
- **React**: Frontend remains unchanged, we optimize API calls and add adaptive video player
- **Node.js**: Same runtime, we add Redis caching and optional microservices split

**Enhancements**:
- Multi-tier caching strategy (Redis + CDN) - Optional, falls back to direct DB
- Optional microservices split (can start as monolith with better structure)
- Load balancing and horizontal scaling (add when needed)
- Adaptive bitrate streaming via VidKing API integration
- Distributed session management
- Real-time performance monitoring
- Graceful degradation and circuit breakers

**Implementation Path**: Start with caching and monitoring, then gradually add other features as you learn and need them.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Browser  │  │ Mobile App   │  │  Smart TV    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CDN Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Static Assets (Posters, Thumbnails, CSS, JS)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx/HAProxy)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Health Checks, SSL Termination, Request Distribution   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Rate Limiting, Authentication, Request Routing          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Auth       │    │   Movie      │    │  Streaming   │
│  Service     │    │  Catalog     │    │   Service    │
│              │    │  Service     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cache Layer (Redis)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Session Data, Movie Metadata, API Responses             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer (MongoDB)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Primary    │  │  Read Replica│  │  Read Replica│          │
│  │   (Write)    │  │   (Read)     │  │   (Read)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### Read-Heavy Operations (Movie Browsing)
1. Client requests movie list
2. Load balancer routes to available API Gateway
3. API Gateway checks rate limits
4. Movie Catalog Service checks Redis cache
5. If cache miss, query MongoDB read replica
6. Store result in Redis with TTL
7. Return response to client

#### Write Operations (User Progress)
1. Client sends progress update
2. Load balancer routes to API Gateway
3. API Gateway validates JWT token
4. Streaming Service updates Redis (fast write)
5. Async worker persists to MongoDB primary
6. Return success to client immediately


## Components and Interfaces

### 1. Cache Layer (Redis)

**Purpose**: Reduce database load and improve response times for frequently accessed data.

**Implementation**:
```javascript
// services/cacheService.js
class CacheService {
  constructor() {
    this.redis = require('redis').createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retry_strategy: (options) => {
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
  }

  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = 300) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key) {
    await this.redis.del(key);
  }

  async exists(key) {
    return await this.redis.exists(key);
  }
}
```

**Cache Keys Strategy**:
- `movie:${movieId}` - Movie metadata (TTL: 1 hour)
- `movie:list:${category}:${page}` - Movie lists (TTL: 5 minutes)
- `user:${userId}:session` - User session data (TTL: 24 hours)
- `user:${userId}:progress:${movieId}` - Watch progress (TTL: 7 days)
- `streaming:sources:${movieId}` - Streaming sources (TTL: 1 hour)

**Cache Invalidation**:
- Time-based: Automatic expiration via TTL
- Event-based: Invalidate on movie updates
- Pattern-based: Clear related keys on bulk operations

### 2. Load Balancer Configuration

**Purpose**: Distribute incoming traffic across multiple server instances.

**Nginx Configuration**:
```nginx
upstream backend {
    least_conn;  # Use least connections algorithm
    server backend1:5000 max_fails=3 fail_timeout=30s;
    server backend2:5000 max_fails=3 fail_timeout=30s;
    server backend3:5000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name streaming.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend/api/health;
    }
}
```

**Health Check Implementation**:
```javascript
// Health check endpoint in server/index.js
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'DEGRADED';
  }

  try {
    // Check Redis
    await redis.ping();
    health.checks.cache = 'healthy';
  } catch (error) {
    health.checks.cache = 'unhealthy';
    health.status = 'DEGRADED';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = memPercent < 90 ? 'healthy' : 'warning';

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});
```


### 3. Microservices Architecture

**Service Decomposition**:

#### Authentication Service (Port 5001)
- User registration and login
- JWT token generation and validation
- Password reset and email verification
- User profile management

**API Endpoints**:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/profile`
- `PUT /auth/profile`

#### Movie Catalog Service (Port 5002)
- Movie metadata management
- Search and filtering
- Genre and category management
- TMDb integration

**API Endpoints**:
- `GET /movies`
- `GET /movies/:id`
- `GET /movies/search`
- `GET /movies/category/:category`
- `GET /genres`

#### Streaming Service (Port 5003)
- Streaming source management
- Video quality selection
- Progress tracking
- Session management

**API Endpoints**:
- `GET /streaming/sources/:movieId`
- `GET /streaming/links/:movieId`
- `POST /streaming/progress/:movieId`
- `GET /streaming/progress/:movieId`

#### Analytics Service (Port 5004)
- User behavior tracking
- Performance metrics
- View counts and statistics
- Real-time monitoring

**API Endpoints**:
- `POST /analytics/event`
- `GET /analytics/metrics`
- `GET /analytics/popular`

**Inter-Service Communication**:
```javascript
// services/serviceRegistry.js
class ServiceRegistry {
  constructor() {
    this.services = {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
      catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:5002',
      streaming: process.env.STREAMING_SERVICE_URL || 'http://localhost:5003',
      analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5004'
    };
  }

  async callService(serviceName, endpoint, options = {}) {
    const baseUrl = this.services[serviceName];
    if (!baseUrl) {
      throw new Error(`Service ${serviceName} not found`);
    }

    try {
      const response = await axios({
        url: `${baseUrl}${endpoint}`,
        timeout: 5000,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error(`Service call failed: ${serviceName}${endpoint}`, error.message);
      throw error;
    }
  }
}
```

### 4. Adaptive Bitrate Streaming (HLS)

**Purpose**: Automatically adjust video quality based on network conditions.

**HLS Manifest Generation**:
```javascript
// services/hlsService.js
class HLSService {
  generateMasterPlaylist(movieId, qualities) {
    const playlist = ['#EXTM3U', '#EXT-X-VERSION:3'];
    
    qualities.forEach(quality => {
      playlist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${quality.bandwidth},RESOLUTION=${quality.resolution}`);
      playlist.push(`${movieId}/${quality.name}.m3u8`);
    });

    return playlist.join('\n');
  }

  generateMediaPlaylist(segments, targetDuration) {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      `#EXT-X-TARGETDURATION:${targetDuration}`,
      '#EXT-X-MEDIA-SEQUENCE:0'
    ];

    segments.forEach(segment => {
      playlist.push(`#EXTINF:${segment.duration},`);
      playlist.push(segment.url);
    });

    playlist.push('#EXT-X-ENDLIST');
    return playlist.join('\n');
  }
}
```

**Quality Profiles**:
```javascript
const QUALITY_PROFILES = {
  '1080p': {
    name: '1080p',
    resolution: '1920x1080',
    bandwidth: 5000000,
    videoBitrate: 4500000,
    audioBitrate: 128000
  },
  '720p': {
    name: '720p',
    resolution: '1280x720',
    bandwidth: 2800000,
    videoBitrate: 2500000,
    audioBitrate: 128000
  },
  '480p': {
    name: '480p',
    resolution: '854x480',
    bandwidth: 1400000,
    videoBitrate: 1200000,
    audioBitrate: 96000
  },
  '360p': {
    name: '360p',
    resolution: '640x360',
    bandwidth: 800000,
    videoBitrate: 700000,
    audioBitrate: 64000
  }
};
```


### 5. Session Management and Progress Tracking

**Purpose**: Track user viewing progress across devices with minimal latency.

**Session Manager Implementation**:
```javascript
// services/sessionManager.js
class SessionManager {
  constructor(cacheService, database) {
    this.cache = cacheService;
    this.db = database;
    this.progressUpdateInterval = 10000; // 10 seconds
    this.batchSize = 100;
    this.pendingUpdates = new Map();
  }

  async startSession(userId, movieId) {
    const sessionId = `${userId}:${movieId}:${Date.now()}`;
    const session = {
      sessionId,
      userId,
      movieId,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      currentPosition: 0,
      duration: 0
    };

    await this.cache.set(`session:${sessionId}`, session, 3600);
    return sessionId;
  }

  async updateProgress(sessionId, position, duration) {
    const session = await this.cache.get(`session:${sessionId}`);
    if (!session) {
      throw new Error('Session not found');
    }

    session.currentPosition = position;
    session.duration = duration;
    session.lastUpdate = Date.now();

    // Update cache immediately
    await this.cache.set(`session:${sessionId}`, session, 3600);

    // Queue for batch database update
    this.pendingUpdates.set(sessionId, session);

    // Trigger batch update if queue is full
    if (this.pendingUpdates.size >= this.batchSize) {
      await this.flushPendingUpdates();
    }
  }

  async flushPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();

    try {
      await this.db.collection('viewing_progress').bulkWrite(
        updates.map(session => ({
          updateOne: {
            filter: { userId: session.userId, movieId: session.movieId },
            update: {
              $set: {
                currentPosition: session.currentPosition,
                duration: session.duration,
                lastUpdate: session.lastUpdate
              }
            },
            upsert: true
          }
        }))
      );
    } catch (error) {
      console.error('Failed to flush progress updates:', error);
    }
  }

  async getProgress(userId, movieId) {
    // Try cache first
    const cacheKey = `progress:${userId}:${movieId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Fallback to database
    const progress = await this.db.collection('viewing_progress').findOne({
      userId,
      movieId
    });

    if (progress) {
      await this.cache.set(cacheKey, progress, 3600);
    }

    return progress;
  }
}
```

**Periodic Flush Worker**:
```javascript
// workers/progressFlushWorker.js
const cron = require('node-cron');

// Flush pending updates every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  await sessionManager.flushPendingUpdates();
});
```

### 6. CDN Integration

**Purpose**: Serve static assets from edge locations close to users.

**CDN Adapter Pattern**:
```javascript
// services/cdnService.js
class CDNService {
  constructor(provider = 'cloudflare') {
    this.provider = provider;
    this.config = {
      cloudflare: {
        baseUrl: process.env.CLOUDFLARE_CDN_URL,
        apiKey: process.env.CLOUDFLARE_API_KEY
      },
      cloudinary: {
        baseUrl: process.env.CLOUDINARY_CDN_URL,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
      },
      aws: {
        baseUrl: process.env.AWS_CLOUDFRONT_URL,
        region: process.env.AWS_REGION
      }
    };
  }

  getAssetUrl(path, options = {}) {
    const config = this.config[this.provider];
    if (!config) {
      return path; // Fallback to original path
    }

    const transformations = this.buildTransformations(options);
    return `${config.baseUrl}${transformations}${path}`;
  }

  buildTransformations(options) {
    const { width, height, quality, format } = options;
    let transforms = '';

    if (width || height) {
      transforms += `/w_${width || 'auto'},h_${height || 'auto'}`;
    }
    if (quality) {
      transforms += `/q_${quality}`;
    }
    if (format) {
      transforms += `/f_${format}`;
    }

    return transforms;
  }

  async invalidateCache(paths) {
    // Implementation depends on CDN provider
    switch (this.provider) {
      case 'cloudflare':
        return this.invalidateCloudflare(paths);
      case 'cloudinary':
        return this.invalidateCloudinary(paths);
      case 'aws':
        return this.invalidateCloudFront(paths);
      default:
        console.warn('Cache invalidation not supported for provider:', this.provider);
    }
  }
}
```

**Usage in Movie Model**:
```javascript
// Update Movie schema to use CDN URLs
movieSchema.methods.getCDNPosterUrl = function(options = {}) {
  return cdnService.getAssetUrl(this.poster, {
    width: options.width || 500,
    quality: options.quality || 80,
    format: 'webp'
  });
};

movieSchema.methods.getCDNBackdropUrl = function(options = {}) {
  return cdnService.getAssetUrl(this.backdrop, {
    width: options.width || 1280,
    quality: options.quality || 85,
    format: 'webp'
  });
};
```


## Data Models

### Session Data Model
```javascript
{
  sessionId: String,
  userId: ObjectId,
  movieId: ObjectId,
  startTime: Date,
  lastUpdate: Date,
  currentPosition: Number,  // in seconds
  duration: Number,         // total duration in seconds
  quality: String,          // current quality setting
  device: String,           // device type
  ipAddress: String,        // for analytics
  userAgent: String
}
```

### Viewing Progress Model
```javascript
{
  userId: ObjectId,
  movieId: ObjectId,
  currentPosition: Number,
  duration: Number,
  progress: Number,         // percentage (0-100)
  completed: Boolean,
  lastWatched: Date,
  watchCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Metrics Model
```javascript
{
  timestamp: Date,
  metricType: String,       // 'api_response', 'video_playback', 'error'
  endpoint: String,
  responseTime: Number,
  statusCode: Number,
  userId: ObjectId,
  movieId: ObjectId,
  metadata: Object,
  tags: [String]
}
```

### Cache Entry Model (Redis)
```javascript
{
  key: String,
  value: JSON,
  ttl: Number,              // seconds until expiration
  createdAt: Number,        // timestamp
  accessCount: Number,
  lastAccessed: Number
}
```

## Error Handling

### Circuit Breaker Pattern

**Purpose**: Prevent cascading failures by stopping requests to failing services.

```javascript
// utils/circuitBreaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }
}
```

### Graceful Degradation Strategy

**Fallback Hierarchy**:
1. Primary source (Redis cache)
2. Secondary source (Database)
3. Stale cache (expired but available)
4. Default/mock data
5. Error response

```javascript
// middleware/gracefulDegradation.js
async function getMovieWithFallback(movieId) {
  // Try cache first
  try {
    const cached = await cacheService.get(`movie:${movieId}`);
    if (cached) return { data: cached, source: 'cache' };
  } catch (error) {
    console.warn('Cache unavailable:', error.message);
  }

  // Try database
  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      // Try to update cache (non-blocking)
      cacheService.set(`movie:${movieId}`, movie, 3600).catch(err => {
        console.warn('Failed to update cache:', err.message);
      });
      return { data: movie, source: 'database' };
    }
  } catch (error) {
    console.error('Database unavailable:', error.message);
  }

  // Try stale cache
  try {
    const stale = await cacheService.get(`movie:${movieId}:stale`);
    if (stale) return { data: stale, source: 'stale_cache', warning: 'Using stale data' };
  } catch (error) {
    console.warn('Stale cache unavailable:', error.message);
  }

  // Return error
  throw new Error('Movie not available');
}
```

### Retry Strategy with Exponential Backoff

```javascript
// utils/retry.js
async function retryWithBackoff(fn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000;
  const maxDelay = options.maxDelay || 10000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```


## Testing Strategy

### Performance Testing

**Load Testing with Artillery**:
```yaml
# load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  plugins:
    metrics-by-endpoint:
      stripQueryString: true

scenarios:
  - name: "Browse movies"
    flow:
      - get:
          url: "/api/movies"
      - think: 2
      - get:
          url: "/api/movies/{{ $randomNumber(1, 1000) }}"
      - think: 3
      - get:
          url: "/api/streaming/sources/{{ $randomNumber(1, 1000) }}"
```

**Stress Testing Scenarios**:
1. Concurrent user simulation (1000+ users)
2. Database connection pool exhaustion
3. Cache failure scenarios
4. Network latency simulation
5. Memory leak detection

### Integration Testing

**Microservices Communication**:
```javascript
// tests/integration/microservices.test.js
describe('Microservices Integration', () => {
  test('Auth service validates token for catalog service', async () => {
    const token = await authService.generateToken(userId);
    const validation = await catalogService.validateRequest(token);
    expect(validation.valid).toBe(true);
  });

  test('Catalog service fetches data with cache fallback', async () => {
    // Simulate cache failure
    await redis.disconnect();
    
    const movies = await catalogService.getMovies();
    expect(movies).toBeDefined();
    expect(movies.source).toBe('database');
  });

  test('Circuit breaker opens after failures', async () => {
    // Simulate service failures
    for (let i = 0; i < 5; i++) {
      await expect(streamingService.getFailingEndpoint()).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe('OPEN');
  });
});
```

### Monitoring and Observability

**Metrics Collection**:
```javascript
// middleware/metricsMiddleware.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const cacheHitRate = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

const cacheMissRate = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    
    activeConnections.dec();
  });

  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

**Logging Strategy**:
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'streaming-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Structured logging
logger.info('Movie requested', {
  movieId: '12345',
  userId: 'user123',
  responseTime: 45,
  cacheHit: true
});
```


## Deployment Architecture

### Docker Compose Setup

**Multi-Container Architecture**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api-gateway
    networks:
      - frontend

  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - AUTH_SERVICE_URL=http://auth-service:5001
      - CATALOG_SERVICE_URL=http://catalog-service:5002
      - STREAMING_SERVICE_URL=http://streaming-service:5003
    depends_on:
      - redis
      - auth-service
      - catalog-service
      - streaming-service
    networks:
      - frontend
      - backend

  # Auth Service
  auth-service:
    build: ./services/auth-service
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/auth
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo-primary
      - redis
    networks:
      - backend
    deploy:
      replicas: 2

  # Catalog Service
  catalog-service:
    build: ./services/catalog-service
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/catalog
      - MONGODB_READ_REPLICA=mongodb://mongo-replica:27017/catalog
      - REDIS_HOST=redis
      - TMDB_API_KEY=${TMDB_API_KEY}
    depends_on:
      - mongo-primary
      - mongo-replica
      - redis
    networks:
      - backend
    deploy:
      replicas: 3

  # Streaming Service
  streaming-service:
    build: ./services/streaming-service
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/streaming
      - REDIS_HOST=redis
    depends_on:
      - mongo-primary
      - redis
    networks:
      - backend
    deploy:
      replicas: 3

  # Analytics Service
  analytics-service:
    build: ./services/analytics-service
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/analytics
      - REDIS_HOST=redis
    depends_on:
      - mongo-primary
      - redis
    networks:
      - backend
    deploy:
      replicas: 2

  # MongoDB Primary
  mongo-primary:
    image: mongo:6
    command: --replSet rs0
    volumes:
      - mongo-primary-data:/data/db
    networks:
      - backend
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

  # MongoDB Read Replica
  mongo-replica:
    image: mongo:6
    command: --replSet rs0
    volumes:
      - mongo-replica-data:/data/db
    networks:
      - backend
    depends_on:
      - mongo-primary

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend
    ports:
      - "6379:6379"

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - backend

  # Grafana Dashboard
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    networks:
      - backend

networks:
  frontend:
  backend:

volumes:
  mongo-primary-data:
  mongo-replica-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

### Scaling Strategy

**Horizontal Scaling**:
```bash
# Scale specific services
docker-compose up -d --scale catalog-service=5
docker-compose up -d --scale streaming-service=5

# Auto-scaling with Docker Swarm
docker service scale streaming_catalog-service=5
```

**Vertical Scaling Considerations**:
- Increase container memory limits for database services
- Allocate more CPU cores to compute-intensive services
- Optimize Redis memory allocation based on cache hit rates

### Environment Configuration

**Production Environment Variables**:
```bash
# .env.production
NODE_ENV=production

# Database
MONGODB_URI=mongodb://mongo-primary:27017,mongo-replica:27017/streaming?replicaSet=rs0
MONGO_PASSWORD=secure_password_here

# Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Services
AUTH_SERVICE_URL=http://auth-service:5001
CATALOG_SERVICE_URL=http://catalog-service:5002
STREAMING_SERVICE_URL=http://streaming-service:5003
ANALYTICS_SERVICE_URL=http://analytics-service:5004

# Security
JWT_SECRET=super_secure_jwt_secret_change_in_production
CORS_ORIGIN=https://yourdomain.com

# CDN
CDN_PROVIDER=cloudflare
CLOUDFLARE_CDN_URL=https://cdn.yourdomain.com
CLOUDFLARE_API_KEY=your_api_key

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password
PROMETHEUS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_PREMIUM_MAX_REQUESTS=1000
```


## Performance Optimization Strategies

### Database Optimization

**Connection Pooling**:
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100,        // Maximum connections
    minPoolSize: 10,         // Minimum connections
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4,               // Use IPv4
    // Read preference for read replicas
    readPreference: 'secondaryPreferred',
    // Write concern
    w: 'majority',
    wtimeout: 5000
  };

  await mongoose.connect(process.env.MONGODB_URI, options);
};
```

**Query Optimization**:
```javascript
// Efficient pagination with cursor-based approach
async function getMoviesCursor(lastId, limit = 20) {
  const query = lastId ? { _id: { $gt: lastId } } : {};
  
  return Movie.find(query)
    .select('title poster rating year genre')  // Only select needed fields
    .sort({ _id: 1 })
    .limit(limit)
    .lean()  // Return plain JavaScript objects
    .exec();
}

// Aggregation pipeline for complex queries
async function getMovieStatistics() {
  return Movie.aggregate([
    { $match: { isActive: true } },
    { $group: {
        _id: '$genre',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalViews: { $sum: '$views' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
}
```

**Index Strategy**:
```javascript
// Compound indexes for common queries
movieSchema.index({ isActive: 1, genre: 1, rating: -1 });
movieSchema.index({ isActive: 1, year: -1, createdAt: -1 });
movieSchema.index({ title: 'text', description: 'text' });

// Partial indexes for specific use cases
movieSchema.index(
  { isFeatured: 1, rating: -1 },
  { partialFilterExpression: { isFeatured: true } }
);
```

### Caching Strategy

**Multi-Level Caching**:
```javascript
// Level 1: In-memory cache (Node.js)
const NodeCache = require('node-cache');
const memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Level 2: Redis cache
const redis = require('redis').createClient();

// Level 3: CDN cache (for static assets)

async function getWithMultiLevelCache(key, fetchFn) {
  // Check memory cache
  let value = memoryCache.get(key);
  if (value) {
    return { data: value, source: 'memory' };
  }

  // Check Redis cache
  value = await redis.get(key);
  if (value) {
    const parsed = JSON.parse(value);
    memoryCache.set(key, parsed);
    return { data: parsed, source: 'redis' };
  }

  // Fetch from source
  value = await fetchFn();
  
  // Update caches
  memoryCache.set(key, value);
  await redis.setex(key, 300, JSON.stringify(value));
  
  return { data: value, source: 'database' };
}
```

**Cache Warming**:
```javascript
// Preload popular content into cache
async function warmCache() {
  const popularMovies = await Movie.find({ isPopular: true })
    .limit(100)
    .lean();

  for (const movie of popularMovies) {
    await cacheService.set(`movie:${movie._id}`, movie, 3600);
  }

  console.log(`Warmed cache with ${popularMovies.length} popular movies`);
}

// Run on server startup
warmCache();
```

### Request Optimization

**Response Compression**:
```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6  // Compression level (0-9)
}));
```

**API Response Pagination**:
```javascript
// Efficient pagination middleware
function paginate(model) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
      const results = {};
      
      // Get total count (cached)
      const cacheKey = `count:${model.modelName}`;
      let total = await cacheService.get(cacheKey);
      
      if (!total) {
        total = await model.countDocuments();
        await cacheService.set(cacheKey, total, 300);
      }

      results.total = total;
      results.page = page;
      results.limit = limit;
      results.pages = Math.ceil(total / limit);

      // Pagination links
      if (page < results.pages) {
        results.next = { page: page + 1, limit };
      }
      if (page > 1) {
        results.previous = { page: page - 1, limit };
      }

      // Execute query
      results.data = await model.find()
        .limit(limit)
        .skip(skip)
        .lean()
        .exec();

      res.paginatedResults = results;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
```

### Client-Side Optimization

**Adaptive Video Player**:
```javascript
// Client-side bandwidth detection
class BandwidthMonitor {
  constructor() {
    this.measurements = [];
    this.maxMeasurements = 10;
  }

  async measureBandwidth() {
    const startTime = Date.now();
    const testSize = 1000000; // 1MB test file
    
    try {
      await fetch(`/api/bandwidth-test?size=${testSize}`);
      const duration = (Date.now() - startTime) / 1000;
      const bandwidth = (testSize * 8) / duration / 1000000; // Mbps
      
      this.measurements.push(bandwidth);
      if (this.measurements.length > this.maxMeasurements) {
        this.measurements.shift();
      }
      
      return bandwidth;
    } catch (error) {
      console.error('Bandwidth measurement failed:', error);
      return null;
    }
  }

  getAverageBandwidth() {
    if (this.measurements.length === 0) return 0;
    const sum = this.measurements.reduce((a, b) => a + b, 0);
    return sum / this.measurements.length;
  }

  getRecommendedQuality() {
    const bandwidth = this.getAverageBandwidth();
    
    if (bandwidth >= 5) return '1080p';
    if (bandwidth >= 2.5) return '720p';
    if (bandwidth >= 1) return '480p';
    return '360p';
  }
}
```

## Security Considerations

### Rate Limiting Implementation

**Advanced Rate Limiter**:
```javascript
// middleware/advancedRateLimiter.js
class AdvancedRateLimiter {
  constructor(redis) {
    this.redis = redis;
    this.limits = {
      free: { requests: 100, window: 60 },      // 100 req/min
      premium: { requests: 1000, window: 60 },  // 1000 req/min
      api: { requests: 10000, window: 60 }      // 10000 req/min
    };
  }

  async checkLimit(userId, tier = 'free') {
    const key = `ratelimit:${tier}:${userId}`;
    const limit = this.limits[tier];
    const now = Date.now();
    const windowStart = now - (limit.window * 1000);

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await this.redis.zcard(key);

    if (count >= limit.requests) {
      const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = parseInt(oldestEntry[1]) + (limit.window * 1000);
      
      return {
        allowed: false,
        limit: limit.requests,
        remaining: 0,
        resetTime: new Date(resetTime)
      };
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, limit.window);

    return {
      allowed: true,
      limit: limit.requests,
      remaining: limit.requests - count - 1,
      resetTime: new Date(now + (limit.window * 1000))
    };
  }
}
```

### DDoS Protection

**Request Pattern Analysis**:
```javascript
// middleware/ddosProtection.js
class DDoSProtection {
  constructor() {
    this.suspiciousIPs = new Map();
    this.threshold = {
      requestsPerSecond: 50,
      uniqueEndpoints: 20,
      failedRequests: 10
    };
  }

  async analyzeRequest(req) {
    const ip = req.ip;
    const now = Date.now();
    
    if (!this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.set(ip, {
        requests: [],
        endpoints: new Set(),
        failures: 0
      });
    }

    const ipData = this.suspiciousIPs.get(ip);
    
    // Track request
    ipData.requests.push(now);
    ipData.endpoints.add(req.path);
    
    // Clean old requests (older than 1 second)
    ipData.requests = ipData.requests.filter(time => now - time < 1000);
    
    // Check for suspicious patterns
    const requestsPerSecond = ipData.requests.length;
    const uniqueEndpoints = ipData.endpoints.size;
    
    if (requestsPerSecond > this.threshold.requestsPerSecond ||
        uniqueEndpoints > this.threshold.uniqueEndpoints ||
        ipData.failures > this.threshold.failedRequests) {
      return {
        suspicious: true,
        reason: 'Abnormal request pattern detected',
        action: 'block'
      };
    }

    return { suspicious: false };
  }
}
```

## Key Takeaways

### Netflix-Inspired Patterns Implemented

1. **Multi-Tier Caching**: Memory → Redis → Database → CDN
2. **Microservices**: Independent, scalable services
3. **Adaptive Streaming**: HLS/DASH with quality adaptation
4. **Horizontal Scaling**: Load balancing across multiple instances
5. **Circuit Breakers**: Prevent cascading failures
6. **Graceful Degradation**: Fallback mechanisms at every layer
7. **Real-Time Monitoring**: Prometheus + Grafana observability
8. **Session Management**: Distributed progress tracking
9. **Database Optimization**: Read replicas, connection pooling, indexes
10. **Security**: Advanced rate limiting, DDoS protection

### Scalability Metrics

**Target Performance**:
- API response time: < 100ms (p95)
- Cache hit rate: > 80%
- Database query time: < 50ms (p95)
- Concurrent users: 10,000+
- Video start time: < 2 seconds
- Uptime: 99.9%

**Cost Optimization**:
- Use caching to reduce database costs
- Implement CDN for bandwidth savings
- Auto-scale based on demand
- Use read replicas for read-heavy workloads
- Optimize video transcoding costs


## VidKing API Integration

### Overview

VidKing (https://www.vidking.net) provides a unified API for accessing multiple streaming sources. This integration will be the primary streaming provider, with existing providers as fallbacks.

### VidKing Service Implementation

```javascript
// services/vidkingService.js
const axios = require('axios');

class VidKingService {
  constructor() {
    this.baseUrl = 'https://vidking.net/api/v1';
    this.apiKey = process.env.VIDKING_API_KEY;
    this.timeout = 10000;
  }

  /**
   * Get streaming sources for a movie/show
   * @param {string} tmdbId - TMDb ID
   * @param {string} type - 'movie' or 'tv'
   * @param {number} season - Season number (for TV shows)
   * @param {number} episode - Episode number (for TV shows)
   */
  async getSources(tmdbId, type = 'movie', season = null, episode = null) {
    try {
      const params = {
        tmdb: tmdbId,
        type: type,
        api_key: this.apiKey
      };

      if (type === 'tv' && season && episode) {
        params.season = season;
        params.episode = episode;
      }

      const response = await axios.get(`${this.baseUrl}/source`, {
        params,
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data && response.data.sources) {
        return this.transformSources(response.data.sources);
      }

      return [];
    } catch (error) {
      console.error('VidKing API error:', error.message);
      throw error;
    }
  }

  /**
   * Transform VidKing sources to our format
   */
  transformSources(sources) {
    return sources.map(source => ({
      url: source.url,
      quality: source.quality || '1080p',
      type: source.type || 'embed',  // 'embed', 'direct', 'hls'
      language: source.language || 'en',
      provider: 'vidking',
      subtitles: source.subtitles || [],
      isWorking: source.status === 'active',
      priority: this.getSourcePriority(source)
    })).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Prioritize sources based on quality and type
   */
  getSourcePriority(source) {
    let priority = 0;

    // Prefer direct/HLS over embed
    if (source.type === 'hls') priority += 30;
    else if (source.type === 'direct') priority += 20;
    else if (source.type === 'embed') priority += 10;

    // Prefer higher quality
    const qualityScores = {
      '1080p': 40,
      '720p': 30,
      '480p': 20,
      '360p': 10
    };
    priority += qualityScores[source.quality] || 0;

    return priority;
  }

  /**
   * Get embed URL for a movie/show
   */
  async getEmbedUrl(tmdbId, type = 'movie', season = null, episode = null) {
    try {
      const params = {
        tmdb: tmdbId,
        type: type,
        api_key: this.apiKey
      };

      if (type === 'tv' && season && episode) {
        params.season = season;
        params.episode = episode;
      }

      const response = await axios.get(`${this.baseUrl}/embed`, {
        params,
        timeout: this.timeout
      });

      return response.data.embed_url;
    } catch (error) {
      console.error('VidKing embed URL error:', error.message);
      throw error;
    }
  }

  /**
   * Search for content
   */
  async search(query, type = 'movie') {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: query,
          type: type,
          api_key: this.apiKey
        },
        timeout: this.timeout
      });

      return response.data.results || [];
    } catch (error) {
      console.error('VidKing search error:', error.message);
      throw error;
    }
  }

  /**
   * Check API status
   */
  async checkStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/status`, {
        params: { api_key: this.apiKey },
        timeout: 5000
      });

      return {
        available: response.data.status === 'online',
        message: response.data.message,
        rateLimit: response.data.rate_limit
      };
    } catch (error) {
      return {
        available: false,
        message: error.message
      };
    }
  }
}

module.exports = new VidKingService();
```

### Enhanced Streaming Service with VidKing

```javascript
// services/enhancedStreamingService.js
const vidkingService = require('./vidkingService');
const streamingService = require('./streamingService'); // Your existing service
const cacheService = require('./cacheService');

class EnhancedStreamingService {
  constructor() {
    this.primaryProvider = 'vidking';
    this.fallbackProviders = ['vidsrc', 'embedSu', 'superEmbed'];
  }

  /**
   * Get streaming sources with caching and fallback
   */
  async getMovieSources(movieId, movieTitle, year) {
    const cacheKey = `streaming:sources:${movieId}`;

    // Check cache first
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return { success: true, data: cached, source: 'cache' };
      }
    } catch (error) {
      console.warn('Cache unavailable:', error.message);
    }

    // Try VidKing first
    try {
      const vidkingSources = await vidkingService.getSources(movieId, 'movie');
      
      if (vidkingSources && vidkingSources.length > 0) {
        const result = {
          primary: vidkingSources,
          fallback: [],
          provider: 'vidking'
        };

        // Cache the result
        await cacheService.set(cacheKey, result, 3600).catch(err => {
          console.warn('Failed to cache sources:', err.message);
        });

        return { success: true, data: result, source: 'vidking' };
      }
    } catch (error) {
      console.error('VidKing failed, trying fallback providers:', error.message);
    }

    // Fallback to existing providers
    try {
      const fallbackSources = await streamingService.getMovieSources(
        movieId,
        movieTitle,
        year
      );

      const result = {
        primary: [],
        fallback: fallbackSources.data,
        provider: 'fallback'
      };

      // Cache with shorter TTL since it's fallback
      await cacheService.set(cacheKey, result, 1800).catch(err => {
        console.warn('Failed to cache fallback sources:', err.message);
      });

      return { success: true, data: result, source: 'fallback' };
    } catch (error) {
      console.error('All providers failed:', error.message);
      return {
        success: false,
        error: 'No streaming sources available',
        data: { primary: [], fallback: [] }
      };
    }
  }

  /**
   * Get embed URL with fallback
   */
  async getEmbedUrl(movieId, movieTitle, year) {
    try {
      // Try VidKing first
      const embedUrl = await vidkingService.getEmbedUrl(movieId, 'movie');
      return {
        success: true,
        url: embedUrl,
        provider: 'vidking'
      };
    } catch (error) {
      console.error('VidKing embed failed, using fallback');
      
      // Fallback to existing providers
      const fallbackEmbeds = await streamingService.getEmbedUrls(
        movieId,
        movieTitle,
        year
      );

      return {
        success: true,
        url: fallbackEmbeds.data[0]?.url,
        provider: 'fallback'
      };
    }
  }
}

module.exports = new EnhancedStreamingService();
```

### Environment Configuration

Add to your `.env` file:

```bash
# VidKing API Configuration
VIDKING_API_KEY=your_vidking_api_key_here
VIDKING_ENABLED=true
VIDKING_PRIORITY=1  # 1 = primary, 2 = fallback
```

### Benefits of VidKing Integration

1. **Unified API**: Single endpoint for multiple streaming sources
2. **Better Quality**: VidKing aggregates high-quality sources
3. **Reliability**: Built-in fallback to your existing providers
4. **Subtitles Support**: VidKing provides subtitle tracks
5. **HLS Support**: Native adaptive bitrate streaming
6. **Caching**: Results are cached to reduce API calls
7. **Graceful Degradation**: Falls back to existing providers if VidKing is down

### Migration Strategy

**Phase 1**: Add VidKing as primary provider (Week 1)
- Implement VidKingService
- Keep existing providers as fallback
- Test with a subset of movies

**Phase 2**: Optimize caching (Week 2)
- Cache VidKing responses
- Implement cache warming for popular movies
- Monitor cache hit rates

**Phase 3**: Full rollout (Week 3)
- Switch all traffic to VidKing
- Monitor performance and reliability
- Keep fallback providers active

This approach maintains your MERN stack while adding enterprise-grade streaming capabilities!
