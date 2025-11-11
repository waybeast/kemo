const express = require('express');
const router = express.Router();
const streamingService = require('../services/streamingService');
const enhancedStreamingService = require('../services/enhancedStreamingService');
const vidkingService = require('../services/vidkingService');
const sessionManager = require('../services/sessionManager');
const tmdbService = require('../services/tmdbService');
const auth = require('../middleware/auth');

// Get streaming sources for a movie (using EnhancedStreamingService)
router.get('/sources/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    let tmdbId = movieId;
    let movieDetails;
    
    // Check if movieId is a MongoDB ObjectId (24 hex characters)
    if (movieId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ID, get the movie from database to find tmdbId
      const Movie = require('../models/Movie');
      const movie = await Movie.findById(movieId);
      
      if (!movie || !movie.tmdbId) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found or missing TMDb ID'
        });
      }
      
      tmdbId = movie.tmdbId;
      movieDetails = {
        title: movie.title,
        release_date: movie.releaseDate,
        poster_path: movie.poster,
        backdrop_path: movie.backdrop,
        imdb_id: movie.imdbId
      };
    } else {
      // It's a TMDb ID, get details from TMDb
      try {
        movieDetails = await tmdbService.getMovieDetails(tmdbId, 'en-US');
      } catch (error) {
        console.error('Failed to get movie details from TMDb:', error);
        return res.status(404).json({
          success: false,
          error: 'Movie not found'
        });
      }
    }

    const year = movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : null;
    const imdbId = movieDetails.imdb_id || null;
    const title = movieDetails.title || movieDetails.original_title;

    // Use EnhancedStreamingService with VidKing as primary and fallback
    const result = await enhancedStreamingService.getSources(
      tmdbId,
      title,
      year,
      imdbId
    );

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error || 'Failed to get streaming sources',
        metadata: result.metadata
      });
    }

    res.json({
      success: true,
      sources: result.sources,
      metadata: result.metadata,
      movie: {
        id: tmdbId,
        title: title,
        year: year,
        poster: movieDetails.poster_path || movieDetails.poster,
        backdrop: movieDetails.backdrop_path || movieDetails.backdrop,
        imdbId: imdbId
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

// Get embed URL for a movie (using EnhancedStreamingService)
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

    const year = new Date(movieDetails.release_date).getFullYear();

    // Use EnhancedStreamingService to get best embed URL
    const result = await enhancedStreamingService.getEmbedUrl(
      movieId,
      movieDetails.title,
      year
    );

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error || 'Failed to get embed URL'
      });
    }

    res.json({
      success: true,
      data: {
        embedUrl: result.url,
        provider: result.provider,
        quality: result.quality,
        type: result.type,
        movie: {
          id: movieId,
          title: movieDetails.title,
          year: year
        }
      }
    });
  } catch (error) {
    console.error('Get embed URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get embed URL'
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

// Test provider availability (using EnhancedStreamingService)
router.get('/test', async (req, res) => {
  try {
    // Use EnhancedStreamingService to test all providers
    const testResults = await enhancedStreamingService.testProviders();

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

// Get service status (using EnhancedStreamingService)
router.get('/status', async (req, res) => {
  try {
    const status = await enhancedStreamingService.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get service status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

// Get user's watch progress for a movie (authenticated)
router.get('/progress/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id.toString();

    const result = await sessionManager.getProgress(userId, movieId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      source: result.source
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
    const { currentTime, duration, progress } = req.body;
    const userId = req.user._id.toString();

    // Validate input
    if (currentTime === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        error: 'currentTime and duration are required'
      });
    }

    // Calculate progress percentage if not provided
    const progressPercent = progress !== undefined 
      ? progress 
      : (currentTime / duration) * 100;

    const result = await sessionManager.updateProgress(userId, movieId, {
      currentTime,
      duration,
      progress: progressPercent
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Watch progress updated',
      data: result.progress
    });
  } catch (error) {
    console.error('Update watch progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update watch progress'
    });
  }
});

// Start a viewing session (authenticated)
router.post('/session/start/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id.toString();
    const metadata = req.body;

    const result = await sessionManager.startSession(userId, movieId, metadata);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.session
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

// End a viewing session (authenticated)
router.post('/session/end/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id.toString();

    const result = await sessionManager.endSession(userId, movieId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.session
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Get active sessions for user (authenticated)
router.get('/session/active', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const result = await sessionManager.getActiveSessions(userId);

    res.json({
      success: true,
      data: result.sessions
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active sessions'
    });
  }
});

module.exports = router; 