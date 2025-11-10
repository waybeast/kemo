#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_MOVIE_ID = '550'; // Fight Club

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎬 Kemo Video Player Manual Test Suite\n');
console.log('This test will guide you through testing the video player manually.\n');

async function testBackendAPIs() {
  console.log('🔧 Testing Backend APIs...\n');
  
  try {
    // Test health
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server Health:', healthResponse.data.status);
    
    // Test movie data
    const movieResponse = await axios.get(`${BASE_URL}/api/movies/${TEST_MOVIE_ID}`);
    const movie = movieResponse.data.data;
    console.log('✅ Movie Data:', {
      title: movie.title,
      year: movie.releaseDate?.split('-')[0],
      runtime: movie.runtime
    });
    
    // Test streaming sources
    const sourcesResponse = await axios.get(`${BASE_URL}/api/streaming/sources/${TEST_MOVIE_ID}`);
    const sources = sourcesResponse.data.data;
    
    const totalSources = Object.values(sources.sources).reduce((total, type) => {
      return total + (type.data ? type.data.length : 0);
    }, 0);
    
    console.log('✅ Streaming Sources:', {
      total: totalSources,
      embed: sources.sources.embed?.data?.length || 0,
      direct: sources.sources.direct?.data?.length || 0,
      hls: sources.sources.hls?.data?.length || 0
    });
    
    // Show sample sources
    if (sources.sources.embed?.data?.length > 0) {
      console.log('\n📺 Sample Sources:');
      sources.sources.embed.data.slice(0, 3).forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.provider} (${source.quality}) - ${source.url}`);
      });
    }
    
    return { movie, sources };
    
  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
    return null;
  }
}

async function testFrontend() {
  console.log('\n🌐 Testing Frontend...\n');
  
  try {
    // Test main page
    const mainPageResponse = await axios.get(FRONTEND_URL);
    if (mainPageResponse.status === 200) {
      console.log('✅ Main page loads successfully');
    }
    
    // Test movie detail page
    const moviePageResponse = await axios.get(`${FRONTEND_URL}/movie/${TEST_MOVIE_ID}`);
    if (moviePageResponse.status === 200) {
      console.log('✅ Movie detail page loads successfully');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    return false;
  }
}

function showManualTestInstructions(movie, sources) {
  console.log('\n🎯 Manual Testing Instructions:\n');
  
  console.log('1. 🌐 Open your browser and navigate to:');
  console.log(`   ${FRONTEND_URL}`);
  console.log('   Expected: Kemo homepage should load with movie carousels\n');
  
  console.log('2. 🎬 Navigate to a movie detail page:');
  console.log(`   ${FRONTEND_URL}/movie/${TEST_MOVIE_ID}`);
  console.log(`   Expected: ${movie.title} detail page should load\n`);
  
  console.log('3. ▶️ Test the video player:');
  console.log(`   ${FRONTEND_URL}/watch/${TEST_MOVIE_ID}`);
  console.log('   Expected: Video player page should load\n');
  
  console.log('4. 🎮 Test Video Player Features:');
  console.log('   - Click "Sources" button to open source manager');
  console.log('   - Select different streaming sources');
  console.log('   - Test video controls (play/pause, volume, fullscreen)');
  console.log('   - Test progress bar and seeking');
  console.log('   - Test source switching\n');
  
  console.log('5. 📱 Test Responsive Design:');
  console.log('   - Resize browser window');
  console.log('   - Test on mobile device or mobile view');
  console.log('   - Verify controls work on touch devices\n');
  
  console.log('6. 🔧 Test Error Handling:');
  console.log('   - Try accessing non-existent movie IDs');
  console.log('   - Test with slow internet connection');
  console.log('   - Verify error messages are user-friendly\n');
  
  if (sources) {
    console.log('\n📊 Available Sources for Testing:');
    const embedSources = sources.sources.embed?.data || [];
    embedSources.slice(0, 5).forEach((source, index) => {
      console.log(`   ${index + 1}. ${source.provider} - ${source.quality}`);
    });
  }
}

async function testSpecificFeatures() {
  console.log('\n🔍 Testing Specific Features...\n');
  
  try {
    // Test provider status
    const providerResponse = await axios.get(`${BASE_URL}/api/streaming/test`);
    const providers = providerResponse.data.data;
    
    console.log('📡 Provider Status:');
    Object.entries(providers).forEach(([provider, status]) => {
      const icon = status.available ? '✅' : '❌';
      console.log(`   ${icon} ${provider}: ${status.available ? 'Available' : 'Unavailable'}`);
    });
    
    // Test analytics
    const analyticsResponse = await axios.post(`${BASE_URL}/api/analytics/track`, {
      event: 'manual_test',
      data: { movieId: TEST_MOVIE_ID, testType: 'video_player' }
    });
    console.log('\n✅ Analytics tracking working');
    
    return true;
    
  } catch (error) {
    console.log('❌ Feature test failed:', error.message);
    return false;
  }
}

function showTroubleshootingGuide() {
  console.log('\n🛠️ Troubleshooting Guide:\n');
  
  console.log('If video player is not working:\n');
  
  console.log('1. 🔍 Check Browser Console:');
  console.log('   - Open Developer Tools (F12)');
  console.log('   - Check Console tab for errors');
  console.log('   - Check Network tab for failed requests\n');
  
  console.log('2. 🌐 Check Network Connectivity:');
  console.log('   - Verify internet connection');
  console.log('   - Check if streaming providers are accessible');
  console.log('   - Try different network (mobile hotspot)\n');
  
  console.log('3. 🔧 Check Server Status:');
  console.log('   - Backend: http://localhost:5000/api/health');
  console.log('   - Frontend: http://localhost:3000');
  console.log('   - Verify both are running\n');
  
  console.log('4. 🎬 Test Different Sources:');
  console.log('   - Try different providers in source manager');
  console.log('   - Test different quality options');
  console.log('   - Check if some sources work while others don\'t\n');
  
  console.log('5. 📱 Test Different Browsers:');
  console.log('   - Chrome, Firefox, Safari, Edge');
  console.log('   - Check if issue is browser-specific\n');
  
  console.log('6. 🔄 Clear Cache:');
  console.log('   - Clear browser cache and cookies');
  console.log('   - Hard refresh (Ctrl+F5)');
  console.log('   - Try incognito/private mode\n');
}

async function runInteractiveTest() {
  console.log('🚀 Starting Interactive Test...\n');
  
  // Test backend
  const backendResult = await testBackendAPIs();
  if (!backendResult) {
    console.log('❌ Backend test failed. Please check server status.');
    return;
  }
  
  // Test frontend
  const frontendResult = await testFrontend();
  if (!frontendResult) {
    console.log('❌ Frontend test failed. Please check frontend status.');
    return;
  }
  
  // Test specific features
  await testSpecificFeatures();
  
  // Show manual test instructions
  showManualTestInstructions(backendResult.movie, backendResult.sources);
  
  // Show troubleshooting guide
  showTroubleshootingGuide();
  
  console.log('\n🎉 Test setup complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open the provided URLs in your browser');
  console.log('2. Follow the manual testing instructions');
  console.log('3. Report any issues you encounter');
  console.log('4. Test on different devices and browsers');
  
  console.log('\n🔗 Quick Access Links:');
  console.log(`   Homepage: ${FRONTEND_URL}`);
  console.log(`   Movie Detail: ${FRONTEND_URL}/movie/${TEST_MOVIE_ID}`);
  console.log(`   Video Player: ${FRONTEND_URL}/watch/${TEST_MOVIE_ID}`);
  console.log(`   Backend Health: ${BASE_URL}/api/health`);
  
  console.log('\n✨ Happy testing! 🎬');
}

// Run the interactive test
runInteractiveTest().catch(console.error); 