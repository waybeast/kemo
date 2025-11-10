const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const tmdbService = require('../services/tmdbService');
const Movie = require('../models/Movie');

async function populateMovies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('TMDb API Key:', process.env.TMDB_API_KEY ? 'Found' : 'Not found');

    // Get popular movies from TMDb
    console.log('Fetching popular movies from TMDb...');
    const popularMovies = await tmdbService.getPopularMovies(1, 'en-US');
    console.log(`Found ${popularMovies.results.length} popular movies`);

    // Get latest movies from TMDb
    console.log('Fetching latest movies from TMDb...');
    const latestMovies = await tmdbService.getLatestMovies(1, 'en-US');
    console.log(`Found ${latestMovies.results.length} latest movies`);

    // Get top rated movies from TMDb
    console.log('Fetching top rated movies from TMDb...');
    const topRatedMovies = await tmdbService.getTopRatedMovies(1, 'en-US');
    console.log(`Found ${topRatedMovies.results.length} top rated movies`);

    // Combine all movies and remove duplicates
    const allMovies = [
      ...popularMovies.results.map(movie => ({ ...movie, source: 'popular' })),
      ...latestMovies.results.map(movie => ({ ...movie, source: 'latest' })),
      ...topRatedMovies.results.map(movie => ({ ...movie, source: 'top_rated' }))
    ];

    // Remove duplicates based on ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );

    console.log(`Total unique movies: ${uniqueMovies.length}`);

    // Sync movies to database
    let syncedCount = 0;
    for (const tmdbMovie of uniqueMovies.slice(0, 20)) { // Limit to 20 movies
      try {
        // Check if movie already exists
        const existingMovie = await Movie.findOne({ tmdbId: tmdbMovie.id });
        if (existingMovie) {
          console.log(`Movie ${tmdbMovie.title} already exists, skipping`);
          continue;
        }

        // Get detailed movie info
        console.log(`Fetching details for: ${tmdbMovie.title}`);
        const movieDetails = await tmdbService.getMovieDetails(tmdbMovie.id);
        const movieData = tmdbService.transformMovieDetails(movieDetails);

        // Create new movie
        const newMovie = new Movie(movieData);
        await newMovie.save();
        
        console.log(`✅ Synced: ${movieData.title}`);
        syncedCount++;
      } catch (error) {
        console.error(`❌ Error syncing ${tmdbMovie.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Sync completed! Synced ${syncedCount} new movies to database.`);
    
    // Show total movies in database
    const totalMovies = await Movie.countDocuments();
    console.log(`📊 Total movies in database: ${totalMovies}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error populating movies:', error);
    process.exit(1);
  }
}

// Run the script
populateMovies(); 