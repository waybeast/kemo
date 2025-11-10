const mongoose = require('mongoose');
const tmdbService = require('../services/tmdbService');
const Movie = require('../models/Movie');
require('dotenv').config();

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kemo-streaming');
    console.log('Connected to MongoDB');

    // Check if TMDb API key is configured
    if (!process.env.TMDB_API_KEY) {
      console.error('TMDb API key not found. Please add TMDB_API_KEY to your .env file');
      process.exit(1);
    }

    console.log('Starting database population...');

    // Get popular movies from TMDb
    console.log('Fetching popular movies...');
    const popularMovies = await tmdbService.getPopularMovies(1, 'en-US');
    const popularIds = popularMovies.results.slice(0, 10).map(movie => movie.id);

    // Get latest movies from TMDb
    console.log('Fetching latest movies...');
    const latestMovies = await tmdbService.getLatestMovies(1, 'en-US');
    const latestIds = latestMovies.results.slice(0, 10).map(movie => movie.id);

    // Get top rated movies from TMDb
    console.log('Fetching top rated movies...');
    const topRatedMovies = await tmdbService.getTopRatedMovies(1, 'en-US');
    const topRatedIds = topRatedMovies.results.slice(0, 10).map(movie => movie.id);

    // Combine all movie IDs and remove duplicates
    const allMovieIds = [...new Set([...popularIds, ...latestIds, ...topRatedIds])];
    console.log(`Found ${allMovieIds.length} unique movies to sync`);

    // Sync movies to database
    console.log('Syncing movies to database...');
    const syncedMovies = await tmdbService.syncMoviesToDatabase(allMovieIds, Movie);

    console.log(`Successfully synced ${syncedMovies.length} movies to database`);

    // Update movie categories
    console.log('Updating movie categories...');
    for (const movie of syncedMovies) {
      const updates = {};

      // Mark as popular if in popular list
      if (popularIds.includes(movie.tmdbId)) {
        updates.isPopular = true;
      }

      // Mark as latest if in latest list
      if (latestIds.includes(movie.tmdbId)) {
        updates.isLatest = true;
      }

      // Mark as featured if high rating or popularity
      if (movie.rating > 7.0 || movie.popularity > 50) {
        updates.isFeatured = true;
      }

      if (Object.keys(updates).length > 0) {
        await Movie.findByIdAndUpdate(movie._id, updates);
      }
    }

    console.log('Database population completed successfully!');
    
    // Show summary
    const totalMovies = await Movie.countDocuments();
    const popularMoviesCount = await Movie.countDocuments({ isPopular: true });
    const latestMoviesCount = await Movie.countDocuments({ isLatest: true });
    const featuredMoviesCount = await Movie.countDocuments({ isFeatured: true });

    console.log('\n=== Database Summary ===');
    console.log(`Total movies: ${totalMovies}`);
    console.log(`Popular movies: ${popularMoviesCount}`);
    console.log(`Latest movies: ${latestMoviesCount}`);
    console.log(`Featured movies: ${featuredMoviesCount}`);

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
populateDatabase(); 