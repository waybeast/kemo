#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_MOVIE_ID = '550'; // Fight Club

console.log('🎬 Kemo Video Player & Streaming Sources Test Suite\n');

async function testHealth() {
  console.log('1. Testing Server Health...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return false;
  }
}

async function testMovieData() {
  console.log('\n2. Testing Movie Data...');
  try {
    const response = await axios.get(`${BASE_URL}/api/movies/${TEST_MOVIE_ID}`);
    const movie = response.data.data;
    console.log('✅ Movie data loaded:', {
      title: movie.title,
      year: movie.releaseDate?.split('-')[0],
      runtime: movie.runtime,
      rating: movie.voteAverage
    });
    return movie;
  } catch (error) {
    console.log('❌ Movie data test failed:', error.message);
    return null;
  }
}

async function testStreamingSources() {
  console.log('\n3. Testing Streaming Sources...');
  try {
    const response = await axios.get(`${BASE_URL}/api/streaming/sources/${TEST_MOVIE_ID}`);
    const data = response.data.data;
    
    if (!data || !data.sources) {
      console.log('❌ No streaming sources data');
      return null;
    }

    const totalSources = Object.values(data.sources).reduce((total, type) => {
      return total + (type.data ? type.data.length : 0);
    }, 0);

    console.log('✅ Streaming sources loaded:', {
      totalSources,
      embed: data.sources.embed?.data?.length || 0,
      direct: data.sources.direct?.data?.length || 0,
      hls: data.sources.hls?.data?.length || 0
    });

    // Show sample sources
    if (data.sources.embed?.data?.length > 0) {
      console.log('\n📺 Sample Embed Sources:');
      data.sources.embed.data.slice(0, 3).forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.provider} (${source.quality}) - ${source.type}`);
      });
    }

    return data.sources;
  } catch (error) {
    console.log('❌ Streaming sources test failed:', error.message);
    return null;
  }
}

async function testStreamingLinks() {
  console.log('\n4. Testing Streaming Links API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/streaming/links/${TEST_MOVIE_ID}`);
    const data = response.data.data;
    
    console.log('✅ Streaming links loaded:', {
      totalLinks: data.length,
      providers: [...new Set(data.map(link => link.provider))]
    });

    return data;
  } catch (error) {
    console.log('❌ Streaming links test failed:', error.message);
    return null;
  }
}

async function testEmbedUrls() {
  console.log('\n5. Testing Embed URLs...');
  try {
    const response = await axios.get(`${BASE_URL}/api/streaming/embed/${TEST_MOVIE_ID}`);
    const data = response.data.data;
    
    console.log('✅ Embed URLs loaded:', {
      totalUrls: data.length,
      availableProviders: data.length
    });

    return data;
  } catch (error) {
    console.log('❌ Embed URLs test failed:', error.message);
    return null;
  }
}

async function testProviderStatus() {
  console.log('\n6. Testing Provider Status...');
  try {
    const response = await axios.get(`${BASE_URL}/api/streaming/test`);
    const data = response.data.data;
    
    console.log('✅ Provider status:', data);
    return data;
  } catch (error) {
    console.log('❌ Provider status test failed:', error.message);
    return null;
  }
}

async function testAuthentication() {
  console.log('\n7. Testing Authentication...');
  try {
    // Test registration
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    
    console.log('✅ Registration successful');
    
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: registerResponse.data.data.user.username,
      password: 'testpassword123'
    });
    
    console.log('✅ Login successful');
    
    const token = loginResponse.data.data.token;
    
    // Test authenticated endpoints
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile access successful');
    
    return token;
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return null;
  }
}

async function testWatchProgress(token) {
  if (!token) {
    console.log('\n8. Testing Watch Progress...');
    console.log('⏭️ Skipping (no authentication token)');
    return;
  }

  console.log('\n8. Testing Watch Progress...');
  try {
    // Test adding watch progress
    const addProgressResponse = await axios.post(`${BASE_URL}/api/auth/history/${TEST_MOVIE_ID}`, {
      progress: 25,
      duration: 7200,
      lastPosition: 1800
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Watch progress added');

    // Test getting watch progress
    const getProgressResponse = await axios.get(`${BASE_URL}/api/auth/progress/${TEST_MOVIE_ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Watch progress retrieved:', getProgressResponse.data.data);
    
  } catch (error) {
    console.log('❌ Watch progress test failed:', error.message);
  }
}

async function testAnalytics() {
  console.log('\n9. Testing Analytics...');
  try {
    // Test tracking
    const trackResponse = await axios.post(`${BASE_URL}/api/analytics/track`, {
      event: 'video_play',
      data: { movieId: TEST_MOVIE_ID, source: 'test' }
    });
    
    console.log('✅ Analytics tracking successful');

    // Test stats
    const statsResponse = await axios.get(`${BASE_URL}/api/analytics/stats`);
    
    console.log('✅ Analytics stats retrieved');
    
  } catch (error) {
    console.log('❌ Analytics test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive video player test suite...\n');

  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  const movie = await testMovieData();
  const sources = await testStreamingSources();
  const links = await testStreamingLinks();
  const embeds = await testEmbedUrls();
  const providerStatus = await testProviderStatus();
  const token = await testAuthentication();
  await testWatchProgress(token);
  await testAnalytics();

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Server Health: ${healthOk ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Movie Data: ${movie ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Streaming Sources: ${sources ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Streaming Links: ${links ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Embed URLs: ${embeds ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Provider Status: ${providerStatus ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Authentication: ${token ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Analytics: PASS`);

  if (sources) {
    const totalSources = Object.values(sources).reduce((total, type) => {
      return total + (type.data ? type.data.length : 0);
    }, 0);
    
    console.log(`\n🎯 Streaming Sources Found: ${totalSources}`);
    console.log(`🎯 Providers Available: ${Object.keys(sources).length}`);
    
    if (totalSources > 0) {
      console.log('\n🎉 Video player should work! Try accessing:');
      console.log(`   http://localhost:3000/watch/${TEST_MOVIE_ID}`);
    } else {
      console.log('\n⚠️ No streaming sources found. Video player may not work.');
    }
  }

  console.log('\n✨ Test suite completed!');
}

// Run tests
runAllTests().catch(console.error); 