#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

console.log('🧪 Testing Kemo Site Functionality...\n');

async function testBackendAPIs() {
  console.log('1. Testing Backend APIs...');
  
  try {
    // Test health endpoint
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log(`   ✅ Health: ${health.data.status}`);
    
    // Test movie categories
    const categories = ['popular', 'latest', 'featured', 'Action', 'Drama', 'Comedy'];
    for (const category of categories) {
      try {
        const response = await axios.get(`${BASE_URL}/api/movies/category/${category}?limit=5`);
        console.log(`   ✅ ${category}: ${response.data.data?.length || 0} movies`);
      } catch (error) {
        console.log(`   ❌ ${category}: ${error.response?.status || 'Error'}`);
      }
    }
    
    // Test movie details
    const movieResponse = await axios.get(`${BASE_URL}/api/movies/550`);
    console.log(`   ✅ Movie Details: ${movieResponse.data.success ? 'OK' : 'Failed'}`);
    
    // Test streaming sources
    const streamingResponse = await axios.get(`${BASE_URL}/api/streaming/sources/550`);
    console.log(`   ✅ Streaming Sources: ${streamingResponse.data.success ? 'OK' : 'Failed'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Backend test failed: ${error.message}`);
    return false;
  }
}

async function testFrontendPages() {
  console.log('\n2. Testing Frontend Pages...');
  
  try {
    // Test main page
    const mainPage = await axios.get(FRONTEND_URL);
    console.log(`   ✅ Main Page: ${mainPage.status === 200 ? 'OK' : 'Failed'}`);
    
    // Test movie detail page
    const moviePage = await axios.get(`${FRONTEND_URL}/movie/550`);
    console.log(`   ✅ Movie Detail Page: ${moviePage.status === 200 ? 'OK' : 'Failed'}`);
    
    // Test video player page
    const playerPage = await axios.get(`${FRONTEND_URL}/watch/550`);
    console.log(`   ✅ Video Player Page: ${playerPage.status === 200 ? 'OK' : 'Failed'}`);
    
    // Test search page
    const searchPage = await axios.get(`${FRONTEND_URL}/search`);
    console.log(`   ✅ Search Page: ${searchPage.status === 200 ? 'OK' : 'Failed'}`);
    
    // Test browse page
    const browsePage = await axios.get(`${FRONTEND_URL}/browse`);
    console.log(`   ✅ Browse Page: ${browsePage.status === 200 ? 'OK' : 'Failed'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n3. Testing Authentication...');
  
  try {
    // Test registration
    const registerData = {
      username: 'testuser' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'testpass123'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log(`   ✅ Registration: ${registerResponse.data.success ? 'OK' : 'Failed'}`);
    
    // Test login
    const loginData = {
      username: registerData.username,
      password: registerData.password
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log(`   ✅ Login: ${loginResponse.data.success ? 'OK' : 'Failed'}`);
    
    return loginResponse.data.success;
  } catch (error) {
    console.log(`   ❌ Auth test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testVideoPlayerFeatures() {
  console.log('\n4. Testing Video Player Features...');
  
  try {
    // Test streaming sources
    const sourcesResponse = await axios.get(`${BASE_URL}/api/streaming/sources/550`);
    const sources = sourcesResponse.data.data;
    
    if (sources && Object.keys(sources).length > 0) {
      console.log(`   ✅ Streaming Sources: ${Object.keys(sources).length} providers available`);
      
      // Test each provider
      for (const [provider, data] of Object.entries(sources)) {
        if (data && data.data && data.data.length > 0) {
          console.log(`      ✅ ${provider}: ${data.data.length} sources`);
        } else {
          console.log(`      ⚠️ ${provider}: No sources available`);
        }
      }
    } else {
      console.log(`   ⚠️ No streaming sources available`);
    }
    
    // Test embed URLs
    const embedResponse = await axios.get(`${BASE_URL}/api/streaming/embed/550`);
    console.log(`   ✅ Embed URLs: ${embedResponse.data.success ? 'OK' : 'Failed'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Video player test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Site Test...\n');
  
  const backendOk = await testBackendAPIs();
  const frontendOk = await testFrontendPages();
  const authOk = await testAuthentication();
  const videoOk = await testVideoPlayerFeatures();
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Backend APIs: ${backendOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Frontend Pages: ${frontendOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Authentication: ${authOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Video Player: ${videoOk ? 'PASS' : 'FAIL'}`);
  
  const allPassed = backendOk && frontendOk && authOk && videoOk;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Site is working correctly.');
    console.log('\n🔗 Test URLs:');
    console.log(`   Homepage: ${FRONTEND_URL}`);
    console.log(`   Movie Detail: ${FRONTEND_URL}/movie/550`);
    console.log(`   Video Player: ${FRONTEND_URL}/watch/550`);
    console.log(`   Search: ${FRONTEND_URL}/search`);
    console.log(`   Browse: ${FRONTEND_URL}/browse`);
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
  
  console.log('\n✨ Test completed!');
}

runAllTests().catch(console.error); 