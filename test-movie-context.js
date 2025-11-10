#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_MOVIE_ID = '550';

console.log('🎬 Testing Movie Context Fix...\n');

async function testMovieAPI() {
  try {
    console.log('1. Testing Movie API...');
    const response = await axios.get(`${BASE_URL}/api/movies/${TEST_MOVIE_ID}`);
    const movie = response.data.data;
    
    console.log('✅ Movie API working:', {
      title: movie.title,
      year: movie.releaseDate?.split('-')[0],
      runtime: movie.runtime
    });
    
    return movie;
  } catch (error) {
    console.log('❌ Movie API failed:', error.message);
    return null;
  }
}

async function testStreamingSources() {
  try {
    console.log('\n2. Testing Streaming Sources...');
    const response = await axios.get(`${BASE_URL}/api/streaming/sources/${TEST_MOVIE_ID}`);
    const data = response.data.data;
    
    const totalSources = Object.values(data.sources).reduce((total, type) => {
      return total + (type.data ? type.data.length : 0);
    }, 0);
    
    console.log('✅ Streaming sources working:', {
      total: totalSources,
      embed: data.sources.embed?.data?.length || 0
    });
    
    return data;
  } catch (error) {
    console.log('❌ Streaming sources failed:', error.message);
    return null;
  }
}

async function testFrontendRoutes() {
  try {
    console.log('\n3. Testing Frontend Routes...');
    
    // Test main page
    const mainResponse = await axios.get('http://localhost:3000');
    console.log('✅ Main page:', mainResponse.status === 200 ? 'Working' : 'Failed');
    
    // Test movie detail page
    const movieResponse = await axios.get(`http://localhost:3000/movie/${TEST_MOVIE_ID}`);
    console.log('✅ Movie detail page:', movieResponse.status === 200 ? 'Working' : 'Failed');
    
    return true;
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Running Movie Context Test...\n');
  
  const movie = await testMovieAPI();
  const sources = await testStreamingSources();
  const frontend = await testFrontendRoutes();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Backend API: ${movie ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Streaming Sources: ${sources ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Frontend Routes: ${frontend ? 'PASS' : 'FAIL'}`);
  
  if (movie && sources) {
    console.log('\n🎉 Backend is working correctly!');
    console.log('\n🔗 Test URLs:');
    console.log(`   Homepage: http://localhost:3000`);
    console.log(`   Movie Detail: http://localhost:3000/movie/${TEST_MOVIE_ID}`);
    console.log(`   Video Player: http://localhost:3000/watch/${TEST_MOVIE_ID}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Open the URLs in your browser');
    console.log('2. Check browser console for any React errors');
    console.log('3. If video player page is blank, check for compilation errors');
    console.log('4. Try refreshing the page (Ctrl+F5)');
  } else {
    console.log('\n❌ Some tests failed. Check server status.');
  }
}

runTest().catch(console.error); 