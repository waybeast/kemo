#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

console.log('🧪 Testing Rate Limits...\n');

async function testRateLimits() {
  try {
    console.log('1. Testing multiple API calls...');
    
    // Test multiple movie category calls
    const categories = ['popular', 'latest', 'featured', 'Action', 'Drama', 'Comedy'];
    const promises = categories.map(category => 
      axios.get(`${BASE_URL}/api/movies/category/${category}?limit=5`)
        .then(response => ({ category, status: response.status, success: true }))
        .catch(error => ({ category, status: error.response?.status, success: false, error: error.message }))
    );
    
    const results = await Promise.all(promises);
    
    console.log('✅ API Call Results:');
    results.forEach(result => {
      if (result.success) {
        console.log(`   ${result.category}: ✅ ${result.status}`);
      } else {
        console.log(`   ${result.category}: ❌ ${result.status} - ${result.error}`);
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Summary: ${successCount} successful, ${failCount} failed`);
    
    if (failCount === 0) {
      console.log('🎉 Rate limiting is working properly!');
    } else {
      console.log('⚠️ Some requests failed - rate limiting might still be too restrictive');
    }
    
    return successCount === categories.length;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testHealth() {
  try {
    console.log('\n2. Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Health check: ${response.data.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Rate Limit Tests...\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }
  
  const rateLimitsOk = await testRateLimits();
  
  console.log('\n📋 Recommendations:');
  if (rateLimitsOk) {
    console.log('✅ Rate limits are working well');
    console.log('✅ You can now use the application without 429 errors');
  } else {
    console.log('⚠️ Consider increasing rate limits further if needed');
    console.log('⚠️ Or optimize frontend to reduce API calls');
  }
  
  console.log('\n🔗 Test URLs:');
  console.log(`   Homepage: http://localhost:3000`);
  console.log(`   Backend Health: ${BASE_URL}/api/health`);
}

runTests().catch(console.error); 