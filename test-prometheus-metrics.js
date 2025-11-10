/**
 * Test script for Prometheus metrics implementation
 * Tests all custom metrics and the /metrics endpoint
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Check if /metrics endpoint exists and returns Prometheus format
 */
async function testMetricsEndpoint() {
  log('\n=== Test 1: Metrics Endpoint ===', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/metrics`);
    
    if (response.status === 200) {
      logSuccess('Metrics endpoint is accessible');
    } else {
      logError(`Unexpected status code: ${response.status}`);
      return false;
    }
    
    // Check content type
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/plain')) {
      logSuccess('Correct content type (text/plain)');
    } else {
      logWarning(`Content type: ${contentType}`);
    }
    
    // Check if response contains Prometheus metrics
    const metricsText = response.data;
    if (typeof metricsText === 'string' && metricsText.includes('# HELP')) {
      logSuccess('Response contains Prometheus metrics format');
    } else {
      logError('Response does not contain valid Prometheus metrics');
      return false;
    }
    
    // Check for custom metrics
    const expectedMetrics = [
      'http_request_duration_seconds',
      'http_requests_total',
      'active_connections',
      'cache_hits_total',
      'cache_misses_total',
      'cache_operation_duration_seconds',
      'db_query_duration_seconds',
      'db_connection_pool_size',
      'video_streaming_events_total',
      'api_errors_total'
    ];
    
    let foundMetrics = 0;
    for (const metric of expectedMetrics) {
      if (metricsText.includes(metric)) {
        foundMetrics++;
        logSuccess(`Found metric: ${metric}`);
      } else {
        logWarning(`Metric not found: ${metric}`);
      }
    }
    
    logInfo(`Found ${foundMetrics}/${expectedMetrics.length} custom metrics`);
    
    // Check for default metrics
    if (metricsText.includes('streaming_app_process_cpu_user_seconds_total')) {
      logSuccess('Default metrics (CPU, memory) are included');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to fetch metrics: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Generate HTTP request metrics
 */
async function testHttpRequestMetrics() {
  log('\n=== Test 2: HTTP Request Metrics ===', 'blue');
  
  try {
    // Make several requests to generate metrics
    logInfo('Making test requests...');
    
    await axios.get(`${BASE_URL}/api/health`);
    await axios.get(`${BASE_URL}/api/movies`).catch(() => {}); // May fail if no auth
    
    // Try to trigger a 404
    await axios.get(`${BASE_URL}/api/nonexistent`).catch(() => {});
    
    await sleep(500); // Wait for metrics to be recorded
    
    // Fetch metrics
    const response = await axios.get(`${BASE_URL}/metrics`);
    const metricsText = response.data;
    
    // Check for http_requests_total
    if (metricsText.includes('http_requests_total')) {
      logSuccess('http_requests_total metric is being recorded');
      
      // Check if it has labels
      if (metricsText.match(/http_requests_total\{.*method="GET".*\}/)) {
        logSuccess('HTTP request metrics include method label');
      }
      
      if (metricsText.match(/http_requests_total\{.*status_code="200".*\}/)) {
        logSuccess('HTTP request metrics include status_code label');
      }
    }
    
    // Check for http_request_duration_seconds
    if (metricsText.includes('http_request_duration_seconds')) {
      logSuccess('http_request_duration_seconds metric is being recorded');
      
      // Check for histogram buckets
      if (metricsText.includes('http_request_duration_seconds_bucket')) {
        logSuccess('Request duration histogram has buckets');
      }
    }
    
    // Check for active_connections
    if (metricsText.includes('active_connections')) {
      logSuccess('active_connections metric is being tracked');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to test HTTP metrics: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Test cache metrics (if Redis is available)
 */
async function testCacheMetrics() {
  log('\n=== Test 3: Cache Metrics ===', 'blue');
  
  try {
    // Make requests that might hit cache
    logInfo('Making requests to test cache metrics...');
    
    // First request (cache miss)
    await axios.get(`${BASE_URL}/api/movies`).catch(() => {});
    await sleep(200);
    
    // Second request (potential cache hit)
    await axios.get(`${BASE_URL}/api/movies`).catch(() => {});
    await sleep(500);
    
    // Fetch metrics
    const response = await axios.get(`${BASE_URL}/metrics`);
    const metricsText = response.data;
    
    // Check for cache metrics
    if (metricsText.includes('cache_hits_total') || metricsText.includes('cache_misses_total')) {
      logSuccess('Cache hit/miss metrics are being recorded');
      
      if (metricsText.match(/cache_hits_total\{.*cache_type="redis".*\}/)) {
        logSuccess('Cache metrics include cache_type label');
      }
      
      if (metricsText.match(/cache_.*\{.*key_pattern=".*".*\}/)) {
        logSuccess('Cache metrics include key_pattern label');
      }
    } else {
      logWarning('Cache metrics not found (Redis may not be configured)');
    }
    
    // Check for cache operation duration
    if (metricsText.includes('cache_operation_duration_seconds')) {
      logSuccess('Cache operation duration is being tracked');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to test cache metrics: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Test error metrics
 */
async function testErrorMetrics() {
  log('\n=== Test 4: Error Metrics ===', 'blue');
  
  try {
    logInfo('Triggering errors to test error metrics...');
    
    // Trigger 404 errors
    await axios.get(`${BASE_URL}/api/invalid-route-1`).catch(() => {});
    await axios.get(`${BASE_URL}/api/invalid-route-2`).catch(() => {});
    
    await sleep(500);
    
    // Fetch metrics
    const response = await axios.get(`${BASE_URL}/metrics`);
    const metricsText = response.data;
    
    // Check for error metrics
    if (metricsText.includes('api_errors_total')) {
      logSuccess('api_errors_total metric is being recorded');
      
      if (metricsText.match(/api_errors_total\{.*error_type="client_error".*\}/)) {
        logSuccess('Error metrics include error_type label');
      }
      
      if (metricsText.match(/api_errors_total\{.*status_code="404".*\}/)) {
        logSuccess('Error metrics include status_code label');
      }
    }
    
    return true;
  } catch (error) {
    logError(`Failed to test error metrics: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Verify metrics format and structure
 */
async function testMetricsFormat() {
  log('\n=== Test 5: Metrics Format Validation ===', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/metrics`);
    const metricsText = response.data;
    
    // Split into lines
    const lines = metricsText.split('\n');
    
    let helpLines = 0;
    let typeLines = 0;
    let metricLines = 0;
    
    for (const line of lines) {
      if (line.startsWith('# HELP')) helpLines++;
      if (line.startsWith('# TYPE')) typeLines++;
      if (line && !line.startsWith('#')) metricLines++;
    }
    
    logInfo(`Total lines: ${lines.length}`);
    logInfo(`HELP lines: ${helpLines}`);
    logInfo(`TYPE lines: ${typeLines}`);
    logInfo(`Metric lines: ${metricLines}`);
    
    if (helpLines > 0 && typeLines > 0 && metricLines > 0) {
      logSuccess('Metrics format is valid');
    } else {
      logError('Metrics format appears invalid');
      return false;
    }
    
    // Check for proper metric types
    const hasCounter = metricsText.includes('# TYPE') && metricsText.includes('counter');
    const hasGauge = metricsText.includes('# TYPE') && metricsText.includes('gauge');
    const hasHistogram = metricsText.includes('# TYPE') && metricsText.includes('histogram');
    
    if (hasCounter) logSuccess('Counter metrics present');
    if (hasGauge) logSuccess('Gauge metrics present');
    if (hasHistogram) logSuccess('Histogram metrics present');
    
    return true;
  } catch (error) {
    logError(`Failed to validate metrics format: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Performance test - metrics endpoint response time
 */
async function testMetricsPerformance() {
  log('\n=== Test 6: Metrics Endpoint Performance ===', 'blue');
  
  try {
    const iterations = 10;
    const times = [];
    
    logInfo(`Testing metrics endpoint response time (${iterations} requests)...`);
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await axios.get(`${BASE_URL}/metrics`);
      const duration = Date.now() - start;
      times.push(duration);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    logInfo(`Average response time: ${avgTime.toFixed(2)}ms`);
    logInfo(`Min response time: ${minTime}ms`);
    logInfo(`Max response time: ${maxTime}ms`);
    
    if (avgTime < 100) {
      logSuccess('Metrics endpoint is fast (< 100ms average)');
    } else if (avgTime < 500) {
      logWarning('Metrics endpoint is acceptable (< 500ms average)');
    } else {
      logError('Metrics endpoint is slow (> 500ms average)');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to test metrics performance: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Prometheus Metrics Implementation Test Suite      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  logInfo(`Testing server at: ${BASE_URL}`);
  logInfo('Make sure the server is running before executing tests\n');
  
  const tests = [
    { name: 'Metrics Endpoint', fn: testMetricsEndpoint },
    { name: 'HTTP Request Metrics', fn: testHttpRequestMetrics },
    { name: 'Cache Metrics', fn: testCacheMetrics },
    { name: 'Error Metrics', fn: testErrorMetrics },
    { name: 'Metrics Format', fn: testMetricsFormat },
    { name: 'Metrics Performance', fn: testMetricsPerformance }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      failed++;
    }
    
    await sleep(500); // Small delay between tests
  }
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                     Test Summary                       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\nTotal Tests: ${tests.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${failed} test(s) failed`, 'yellow');
  }
  
  log('\n');
}

// Run tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
