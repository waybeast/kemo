const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');
const Movie = require('../models/Movie');
const auth = require('../middleware/auth');

// Get popular movies from TMDb
router.get('/popular', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getPopularMovies(page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular movies'
    });
  }
});

// Get latest movies from TMDb
router.get('/latest', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getLatestMovies(page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching latest movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest movies'
    });
  }
});

// Get top rated movies from TMDb
router.get('/top-rated', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getTopRatedMovies(page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top rated movies'
    });
  }
});

// Get upcoming movies from TMDb
router.get('/upcoming', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getUpcomingMovies(page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming movies'
    });
  }
});

// Get trending movies from TMDb
router.get('/trending', async (req, res) => {
  try {
    const { timeWindow = 'week', page = 1 } = req.query;
    const movies = await tmdbService.getTrendingMovies(timeWindow, page);
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending movies'
    });
  }
});

// Get movies by genre from TMDb
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getMoviesByGenre(genreId, page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movies by genre'
    });
  }
});

// Get movie details from TMDb
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const movie = await tmdbService.getMovieDetails(tmdbId, 'en-US');
    
    res.json({
      success: true,
      data: tmdbService.transformMovieDetails(movie)
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie details'
    });
  }
});

// Search movies on TMDb
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const movies = await tmdbService.searchMovies(q, page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search movies'
    });
  }
});

// Get movie genres from TMDb
router.get('/genres', async (req, res) => {
  try {
    const genres = await tmdbService.getGenres('en-US');
    
    res.json({
      success: true,
      data: genres.genres
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genres'
    });
  }
});

// Get movie recommendations from TMDb
router.get('/movie/:tmdbId/recommendations', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const movies = await tmdbService.getMovieRecommendations(tmdbId, page, 'en-US');
    
    res.json({
      success: true,
      data: movies.results.map(movie => tmdbService.transformMovieData(movie)),
      pagination: {
        page: movies.page,
        totalPages: movies.total_pages,
        totalResults: movies.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie recommendations'
    });
  }
});

// Sync movie from TMDb to our database
router.post('/sync/:tmdbId', auth, async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    // Check if movie already exists
    const existingMovie = await Movie.findOne({ tmdbId });
    if (existingMovie) {
      return res.json({
        success: true,
        message: 'Movie already exists in database',
        data: existingMovie
      });
    }

    // Fetch movie details from TMDb
    const tmdbMovie = await tmdbService.getMovieDetails(tmdbId, 'en-US');
    const movieData = tmdbService.transformMovieDetails(tmdbMovie);

    // Create new movie in database
    const newMovie = new Movie(movieData);
    await newMovie.save();
    
    res.json({
      success: true,
      message: 'Movie synced successfully',
      data: newMovie
    });
  } catch (error) {
    console.error('Error syncing movie:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync movie'
    });
  }
});

// Test endpoint to check Movie model
router.post('/test-movie', async (req, res) => {
  try {
    const testMovie = new Movie({
      title: 'Test Movie',
      originalTitle: 'Test Movie',
      description: 'A test movie',
      genre: ['Action'],
      year: 2024,
      releaseDate: new Date(),
      rating: 7.5,
      poster: 'https://example.com/poster.jpg',
      backdrop: 'https://example.com/backdrop.jpg',
      tmdbId: 999999,
      isActive: true,
      isFeatured: false,
      isLatest: false,
      isPopular: false,
      views: 100
    });

    const savedMovie = await testMovie.save();
    console.log('Test movie saved:', savedMovie._id);
    
    res.json({
      success: true,
      message: 'Test movie saved successfully',
      data: savedMovie
    });
  } catch (error) {
    console.error('Error saving test movie:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save test movie',
      details: error.message
    });
  }
});

// Bulk sync popular movies to database (no auth for development)
router.post('/sync-popular', async (req, res) => {
  console.log('=== SYNC POPULAR ENDPOINT CALLED ===');
  console.log('Request body:', req.body);
  
  try {
    const { limit = 20 } = req.body;
    console.log('Starting bulk sync with limit:', limit);
    
    // Get popular movies from TMDb
    const popularMovies = await tmdbService.getPopularMovies(1, 'en-US');
    console.log('Got popular movies from TMDb:', popularMovies.results.length);
    
    const movieIds = popularMovies.results.slice(0, limit).map(movie => movie.id);
    console.log('Movie IDs to sync:', movieIds);
    
    // Manually sync movies to database
    const syncedMovies = [];
    
    for (const tmdbId of movieIds) {
      try {
        console.log(`Processing movie ID: ${tmdbId}`);
        
        // Check if movie already exists
        const existingMovie = await Movie.findOne({ tmdbId });
        if (existingMovie) {
          console.log(`Movie ${tmdbId} already exists, skipping`);
          syncedMovies.push(existingMovie);
          continue;
        }

        console.log(`Fetching movie details for ID: ${tmdbId}`);
        // Fetch movie details from TMDb
        const tmdbMovie = await tmdbService.getMovieDetails(tmdbId);
        const movieData = tmdbService.transformMovieDetails(tmdbMovie);
        console.log(`Transformed movie data for: ${movieData.title}`);

        // Create new movie in database
        const newMovie = new Movie(movieData);
        await newMovie.save();
        console.log(`Successfully saved movie: ${movieData.title}`);
        
        syncedMovies.push(newMovie);
        console.log(`Synced movie: ${movieData.title}`);
      } catch (error) {
        console.error(`Error syncing movie ${tmdbId}:`, error.message);
      }
    }
    
    console.log('Sync completed. Total synced:', syncedMovies.length);
    
    res.json({
      success: true,
      message: `Synced ${syncedMovies.length} movies to database`,
      data: syncedMovies
    });
  } catch (error) {
    console.error('Error bulk syncing movies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk sync movies'
    });
  }
});

// Get TMDb configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      imageBaseURL: tmdbService.imageBaseURL,
      posterSizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
      backdropSizes: ['w300', 'w780', 'w1280', 'original'],
      profileSizes: ['w45', 'w185', 'h632', 'original'],
      isConfigured: !!tmdbService.apiKey
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching TMDb config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TMDb configuration'
    });
  }
});

module.exports = router; 