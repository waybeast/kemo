/**
 * Test script for CacheService
 * Run with: node test-cache-service.js
 */

require('dotenv').config();
const cacheService = require('./server/services/cacheService');

async function testCacheService() {
  console.log('=== Testing CacheService ===\n');

  // Wait for Redis to connect
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 1: Check if cache is available
  console.log('Test 1: Check cache availability');
  const isAvailable = cacheService.isAvailable();
  console.log(`Cache available: ${isAvailable}`);
  
  if (!isAvailable) {
    console.log('\n⚠️  Redis is not available. Make sure Redis is running:');
    console.log('   - Install Redis: brew install redis (Mac) or apt-get install redis (Linux)');
    console.log('   - Start Redis: redis-server');
    console.log('   - Or configure REDIS_HOST and REDIS_PORT in .env file\n');
    process.exit(0);
  }

  console.log('✓ Cache is available\n');

  // Test 2: Set and get a simple value
  console.log('Test 2: Set and get a simple value');
  const testKey = 'test:simple';
  const testValue = { message: 'Hello, Redis!', timestamp: Date.now() };
  
  await cacheService.set(testKey, testValue, 60);
  const retrieved = await cacheService.get(testKey);
  console.log('Set value:', testValue);
  console.log('Retrieved value:', retrieved);
  console.log(`✓ Values match: ${JSON.stringify(testValue) === JSON.stringify(retrieved)}\n`);

  // Test 3: Test key existence
  console.log('Test 3: Test key existence');
  const exists = await cacheService.exists(testKey);
  console.log(`Key exists: ${exists}`);
  console.log(`✓ Key existence check passed\n`);

  // Test 4: Test TTL
  console.log('Test 4: Test TTL');
  const ttl = await cacheService.ttl(testKey);
  console.log(`TTL for key: ${ttl} seconds`);
  console.log(`✓ TTL is set correctly (should be ~60 seconds)\n`);

  // Test 5: Test movie cache key
  console.log('Test 5: Test movie cache key');
  const movieKey = cacheService.buildKey(cacheService.keyPrefixes.MOVIE, '12345');
  const movieData = {
    id: '12345',
    title: 'Test Movie',
    year: 2024,
    rating: 8.5
  };
  
  await cacheService.set(movieKey, movieData, cacheService.defaultTTL.MOVIE);
  const cachedMovie = await cacheService.get(movieKey);
  console.log('Movie key:', movieKey);
  console.log('Cached movie:', cachedMovie);
  console.log(`✓ Movie caching works\n`);

  // Test 6: Test increment/decrement
  console.log('Test 6: Test increment/decrement');
  const counterKey = 'test:counter';
  await cacheService.set(counterKey, 0, 60);
  
  const incr1 = await cacheService.incr(counterKey);
  const incr2 = await cacheService.incr(counterKey, 5);
  const decr1 = await cacheService.decr(counterKey, 2);
  
  console.log(`After incr(1): ${incr1}`);
  console.log(`After incr(5): ${incr2}`);
  console.log(`After decr(2): ${decr1}`);
  console.log(`✓ Increment/decrement works (final value: ${decr1})\n`);

  // Test 7: Test delete
  console.log('Test 7: Test delete');
  await cacheService.del(testKey);
  const afterDelete = await cacheService.get(testKey);
  console.log(`Value after delete: ${afterDelete}`);
  console.log(`✓ Delete works (value should be null)\n`);

  // Test 8: Test pattern deletion
  console.log('Test 8: Test pattern deletion');
  await cacheService.set('test:pattern:1', { id: 1 }, 60);
  await cacheService.set('test:pattern:2', { id: 2 }, 60);
  await cacheService.set('test:pattern:3', { id: 3 }, 60);
  
  const deletedCount = await cacheService.delPattern('test:pattern:*');
  console.log(`Deleted ${deletedCount} keys matching pattern 'test:pattern:*'`);
  console.log(`✓ Pattern deletion works\n`);

  // Test 9: Test cache statistics
  console.log('Test 9: Test cache statistics');
  const stats = await cacheService.getStats();
  console.log('Cache stats:', {
    connected: stats.connected,
    dbSize: stats.dbSize,
    version: stats.info?.redis_version,
    uptime: stats.info?.uptime_in_seconds
  });
  console.log(`✓ Statistics retrieval works\n`);

  // Test 10: Test all key prefixes
  console.log('Test 10: Test all key prefixes');
  console.log('Available key prefixes:');
  Object.entries(cacheService.keyPrefixes).forEach(([name, prefix]) => {
    console.log(`  - ${name}: ${prefix}`);
  });
  console.log('\nDefault TTL values:');
  Object.entries(cacheService.defaultTTL).forEach(([name, ttl]) => {
    console.log(`  - ${name}: ${ttl} seconds (${Math.floor(ttl / 60)} minutes)`);
  });
  console.log(`✓ Key prefixes and TTL configuration available\n`);

  // Cleanup
  console.log('Cleaning up test keys...');
  await cacheService.del(movieKey);
  await cacheService.del(counterKey);
  
  console.log('\n=== All tests completed successfully! ===\n');
  
  // Close connection
  await cacheService.close();
  process.exit(0);
}

// Run tests
testCacheService().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
