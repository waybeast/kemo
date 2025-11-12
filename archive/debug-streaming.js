#!/usr/bin/env node

const axios = require('axios');

const movieId = '278'; // The Shawshank Redemption
const API_URL = 'http://localhost:5000/api';

async function testStreaming() {
  console.log('🔍 Testing Streaming API...\n');
  
  try {
    console.log(`Fetching sources for movie ${movieId}...`);
    const response = await axios.get(`${API_URL}/streaming/sources/${movieId}`);
    
    console.log('✅ API Response:');
    console.log('Success:', response.data.success);
    console.log('Total Sources:', response.data.sources?.length || 0);
    console.log('\n📺 Sources:');
    
    if (response.data.sources && response.data.sources.length > 0) {
      response.data.sources.forEach((source, index) => {
        console.log(`\n${index + 1}. ${source.provider.toUpperCase()}`);
        console.log(`   URL: ${source.url}`);
        console.log(`   Quality: ${source.quality}`);
        console.log(`   Type: ${source.type}`);
        console.log(`   Priority: ${source.priority}`);
      });
    } else {
      console.log('❌ No sources found!');
    }
    
    console.log('\n📊 Metadata:');
    console.log('Primary Provider:', response.data.metadata?.primaryProvider);
    console.log('Primary Success:', response.data.metadata?.primarySuccess);
    console.log('Fallback Used:', response.data.metadata?.fallbackUsed);
    
    console.log('\n🎬 Movie Info:');
    console.log('Title:', response.data.movie?.title);
    console.log('Year:', response.data.movie?.year);
    console.log('IMDB ID:', response.data.movie?.imdbId);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testStreaming();
