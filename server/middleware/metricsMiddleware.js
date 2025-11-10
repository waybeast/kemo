const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'streaming_app_'
});

// Custom Metrics

// 1. HTTP Request Duration Histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10] // Response time buckets in seconds
});

// 2. HTTP Request Total Counter
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// 3. Active Connections Gauge
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active HTTP connections'
});

// 4. Cache Hit Counter
const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'key_pattern']
});

// 5. Cache Miss Counter
const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type', 'key_pattern']
});

// 6. Cache Operation Duration
const cacheOperationDuration = new promClient.Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

// 7. Database Query Duration
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// 8. Database Connection Pool Gauge
const dbConnectionPool = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Current size of database connection pool',
  labelNames: ['state'] // 'active', 'idle', 'total'
});

// 9. Video Streaming Events Counter
const videoStreamingEvents = new promClient.Counter({
  name: 'video_streaming_events_total',
  help: 'Total number of video streaming events',
  labelNames: ['event_type', 'quality'] // event_type: 'start', 'pause', 'resume', 'complete', 'buffer'
});

// 10. API Error Counter
const apiErrors = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['method', 'route', 'error_type', 'status_code']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(cacheOperationDuration);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionPool);
register.registerMetric(videoStreamingEvents);
register.registerMetric(apiErrors);

/**
 * Middleware to track HTTP request metrics
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response is sent
  res.end = function(...args) {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;
    
    // Get route path (use route.path if available, otherwise use req.path)
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode
    });

    // Track errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      apiErrors.inc({
        method,
        route,
        error_type: errorType,
        status_code: statusCode
      });
    }
    
    // Decrement active connections
    activeConnections.dec();

    // Call the original end function
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Helper function to record cache hit
 */
function recordCacheHit(cacheType = 'redis', keyPattern = 'general') {
  cacheHits.inc({ cache_type: cacheType, key_pattern: keyPattern });
}

/**
 * Helper function to record cache miss
 */
function recordCacheMiss(cacheType = 'redis', keyPattern = 'general') {
  cacheMisses.inc({ cache_type: cacheType, key_pattern: keyPattern });
}

/**
 * Helper function to record cache operation duration
 */
function recordCacheOperation(operation, cacheType, duration) {
  cacheOperationDuration.observe(
    { operation, cache_type: cacheType },
    duration
  );
}

/**
 * Helper function to record database query duration
 */
function recordDbQuery(operation, collection, duration) {
  dbQueryDuration.observe(
    { operation, collection },
    duration
  );
}

/**
 * Helper function to update database connection pool metrics
 */
function updateDbConnectionPool(active, idle, total) {
  dbConnectionPool.set({ state: 'active' }, active);
  dbConnectionPool.set({ state: 'idle' }, idle);
  dbConnectionPool.set({ state: 'total' }, total);
}

/**
 * Helper function to record video streaming events
 */
function recordVideoEvent(eventType, quality = 'unknown') {
  videoStreamingEvents.inc({ event_type: eventType, quality });
}

/**
 * Get metrics in Prometheus format
 */
async function getMetrics() {
  return await register.metrics();
}

/**
 * Get content type for metrics endpoint
 */
function getMetricsContentType() {
  return register.contentType;
}

module.exports = {
  metricsMiddleware,
  recordCacheHit,
  recordCacheMiss,
  recordCacheOperation,
  recordDbQuery,
  updateDbConnectionPool,
  recordVideoEvent,
  getMetrics,
  getMetricsContentType,
  // Export individual metrics for direct access if needed
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    activeConnections,
    cacheHits,
    cacheMisses,
    cacheOperationDuration,
    dbQueryDuration,
    dbConnectionPool,
    videoStreamingEvents,
    apiErrors
  }
};
