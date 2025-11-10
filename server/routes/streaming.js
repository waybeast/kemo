const express = require('express');
const router = express.Router();
const streamingService = require('../services/streamingService');
const vidkingService = require('../services/vidkingService');
const tmdbService = require('../services/tmdbService');
const auth = require('../middleware/auth');

// Get streaming sources for a movie
router.get('/sources/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // First get movie details from TMDb
    let movieDetails;
    try {
      movieDetails = await tmdbService.getMovieDetails(movieId, 'en-US');
    } catch (error) {
      console.error('Failed to get movie details from TMDb:', error);
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    // Get streaming sources
    const sources = await streamingService.getMovieSources(
      movieId,
      movieDetails.title,
      new Date(movieDetails.release_date).getFullYear()
    );

    res.json({
      success: true,
      data: {
        movie: {
          id: movieId,
          title: movieDetails.title,
          year: new Date(movieDetails.release_date).getFullYear(),
          poster: tmdbService.getPosterURL(movieDetails.poster_path),
          backdrop: tmdbService.getBackdropURL(movieDetails.backdrop_path)
        },
        sources: sources.data
      }
    });
  } catch (error) {
    console.error('Get streaming sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streaming sources'
    });
  }
});

// Get streaming links for a movie
router.get('/links/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Get movie details from TMDb
    let movieDetails;
    try {
      movieDetails = await tmdbService.getMovieDetails(movieId, 'en-US');
    } catch (error) {
      console.error('Failed to get movie details from TMDb:', error);
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    // Get streaming links
    const links = await streamingService.getStreamingLinks(
      movieId,
      movieDetails.title,
      new Date(movieDetails.release_date).getFullYear()
    );

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Get streaming links error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streaming links'
    });
  }
});

// Get embed URLs for a movie
router.get('/embed/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Get movie details from TMDb
    let movieDetails;
    try {
      movieDetails = await tmdbService.getMovieDetails(movieId, 'en-US');
    } catch (error) {
      console.error('Failed to get movie details from TMDb:', error);
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    // Get embed URLs
    const embedUrls = await streamingService.getEmbedUrls(
      movieId,
      movieDetails.title,
      new Date(movieDetails.release_date).getFullYear()
    );

    res.json({
      success: true,
      data: embedUrls
    });
  } catch (error) {
    console.error('Get embed URLs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get embed URLs'
    });
  }
});

// Search streaming providers
router.get('/search', async (req, res) => {
  try {
    const { q: query, year } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await streamingService.searchStreamingLinks(query, year);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search streaming error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search streaming providers'
    });
  }
});

// Get VidKing embed URL for a movie
router.get('/vidking/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { type = 'movie', season, episode } = req.query;

    if (!vidkingService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'VidKing service is not enabled'
      });
    }

    // Get embed URL
    const embedUrl = await vidkingService.getEmbedUrl(
      movieId,
      type,
      season ? parseInt(season) : null,
      episode ? parseInt(episode) : null
    );

    // Get sources
    const sources = await vidkingService.getSources(
      movieId,
      type,
      season ? parseInt(season) : null,
      episode ? parseInt(episode) : null
    );

    res.json({
      success: true,
      data: {
        embedUrl,
        sources,
        provider: 'vidking',
        tmdbId: movieId
      }
    });
  } catch (error) {
    console.error('VidKing embed error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get VidKing embed'
    });
  }
});

// Test provider availability
router.get('/test', async (req, res) => {
  try {
    const testResults = await streamingService.testProviders();
    
    // Add VidKing status
    if (vidkingService.isEnabled()) {
      testResults.vidking = await vidkingService.checkStatus();
    }

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    console.error('Test providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test providers'
    });
  }
});

// Get user's watch progress for a movie (authenticated)
router.get('/progress/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    const progress = user.getWatchProgress(movieId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get watch progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get watch progress'
    });
  }
});

// Update watch progress (authenticated)
router.post('/progress/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { progress, duration, lastPosition } = req.body;
    const user = req.user;

    await user.addToHistory(movieId, progress, duration, lastPosition);

    res.json({
      success: true,
      message: 'Watch progress updated'
    });
  } catch (error) {
    console.error('Update watch progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update watch progress'
    });
  }
});

module.exports = router; 