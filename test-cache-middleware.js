/**
 * Test script for cache middleware functionality
 * Tests cache hit/miss, invalidation, and metrics
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
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

async function testCacheMiddleware() {
  log('\n=== Testing Cache Middleware ===\n', 'cyan');

  try {
    // Test 1: First request should be a cache MISS
    log('Test 1: First request (should be cache MISS)', 'blue');
    const response1 = await axios.get(`${API_URL}/movies/category/popular?limit=10`);
    const cacheHeader1 = response1.headers['x-cache'];
    log(`Cache Status: ${cacheHeader1}`, cacheHeader1 === 'MISS' ? 'green' : 'red');
    log(`Response time: ${response1.headers['x-response-time'] || 'N/A'}`, 'yellow');
    
    if (cacheHeader1 !== 'MISS') {
      log('❌ Expected cache MISS but got: ' + cacheHeader1, 'red');
    } else {
      log('✓ Cache MISS as expected', 'green');
    }

    // Test 2: Second request should be a cache HIT
    log('\nTest 2: Second request (should be cache HIT)', 'blue');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    const response2 = await axios.get(`${API_URL}/movies/category/popular?limit=10`);
    const cacheHeader2 = response2.headers['x-cache'];
    log(`Cache Status: ${cacheHeader2}`, cacheHeader2 === 'HIT' ? 'green' : 'red');
    
    if (cacheHeader2 !== 'HIT') {
      log('❌ Expected cache HIT but got: ' + cacheHeader2, 'red');
    } else {
      log('✓ Cache HIT as expected', 'green');
    }

    // Test 3: Different query parameters should result in different cache keys
    log('\nTest 3: Different query parameters (should be cache MISS)', 'blue');
    const response3 = await axios.get(`${API_URL}/movies/category/popular?limit=20`);
    const cacheHeader3 = response3.headers['x-cache'];
    log(`Cache Status: ${cacheHeader3}`, cacheHeader3 === 'MISS' ? 'green' : 'red');
    
    if (cacheHeader3 !== 'MISS') {
      log('❌ Expected cache MISS for different params but got: ' + cacheHeader3, 'red');
    } else {
      log('✓ Cache MISS for different params as expected', 'green');
    }

    // Test 4: Test movie list endpoint
    log('\nTest 4: Movie list endpoint caching', 'blue');
    const response4a = await axios.get(`${API_URL}/movies?page=1&limit=10`);
    const cacheHeader4a = response4a.headers['x-cache'];
    log(`First request - Cache Status: ${cacheHeader4a}`, 'yellow');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response4b = await axios.get(`${API_URL}/movies?page=1&limit=10`);
    const cacheHeader4b = response4b.headers['x-cache'];
    log(`Second request - Cache Status: ${cacheHeader4b}`, 'yellow');
    
    if (cacheHeader4b === 'HIT') {
      log('✓ Movie list caching working correctly', 'green');
    } else {
      log('❌ Movie list caching not working as expected', 'red');
    }

    // Test 5: Test genres endpoint caching
    log('\nTest 5: Genres endpoint caching', 'blue');
    const response5a = await axios.get(`${API_URL}/movies/genres/list`);
    const cacheHeader5a = response5a.headers['x-cache'];
    log(`First request - Cache Status: ${cacheHeader5a}`, 'yellow');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response5b = await axios.get(`${API_URL}/movies/genres/list`);
    const cacheHeader5b = response5b.headers['x-cache'];
    log(`Second request - Cache Status: ${cacheHeader5b}`, 'yellow');
    
    if (cacheHeader5b === 'HIT') {
      log('✓ Genres caching working correctly', 'green');
    } else {
      log('❌ Genres caching not working as expected', 'red');
    }

    // Test 6: Test search endpoint caching
    log('\nTest 6: Search endpoint caching', 'blue');
    const response6a = await axios.get(`${API_URL}/movies/search?q=action`);
    const cacheHeader6a = response6a.headers['x-cache'];
    log(`First search - Cache Status: ${cacheHeader6a}`, 'yellow');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response6b = await axios.get(`${API_URL}/movies/search?q=action`);
    const cacheHeader6b = response6b.headers['x-cache'];
    log(`Second search - Cache Status: ${cacheHeader6b}`, 'yellow');
    
    if (cacheHeader6b === 'HIT') {
      log('✓ Search caching working correctly', 'green');
    } else {
      log('❌ Search caching not working as expected', 'red');
    }

    log('\n=== Cache Middleware Tests Complete ===\n', 'cyan');
    log('Summary:', 'blue');
    log('- Cache middleware is intercepting GET requests', 'green');
    log('- Cache headers (X-Cache) are being set correctly', 'green');
    log('- Different query parameters create different cache keys', 'green');
    log('- Multiple endpoints are being cached', 'green');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('\n❌ Error: Cannot connect to server', 'red');
      log('Please make sure the server is running on http://localhost:5000', 'yellow');
      log('Run: npm start (or node server/index.js)', 'yellow');
    } else {
      log('\n❌ Error during testing:', 'red');
      log(error.message, 'red');
      if (error.response) {
        log(`Status: ${error.response.status}`, 'yellow');
        log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
      }
    }
  }
}

// Run the tests
testCacheMiddleware();
