const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const telegramService = require('../services/telegramService');
const tmdbService = require('../services/tmdbService');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cacheMiddleware');

// Get all movies with pagination and filtering
router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'route' }), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      year,
      sort = 'createdAt',
      order = 'desc',
      search
    } = req.query;

    // Try to get movies from database first
    try {
      const query = { isActive: true };
      
      // Apply filters
      if (genre) {
        query.genre = { $in: [genre] };
      }
      
      if (year) {
        query.year = parseInt(year);
      }
      
      if (search) {
        query.$text = { $search: search };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: '-streamingUrls' // Don't send streaming URLs in list
      };

      const movies = await Movie.paginate(query, options);
      
      return res.json({
        success: true,
        data: movies.docs,
        pagination: {
          page: movies.page,
          totalPages: movies.totalPages,
          totalDocs: movies.totalDocs,
          hasNextPage: movies.hasNextPage,
          hasPrevPage: movies.hasPrevPage
        }
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API');
      
      // Fallback to TMDb API
      const tmdbMovies = await tmdbService.getPopularMovies(parseInt(page), 'en-US');
      const movies = tmdbMovies.results.slice(0, parseInt(limit)).map(movie => tmdbService.transformMovieData(movie));
      
      return res.json({
        success: true,
        data: movies,
        pagination: {
          page: parseInt(page),
          totalPages: tmdbMovies.total_pages,
          totalDocs: tmdbMovies.total_results,
          hasNextPage: parseInt(page) < tmdbMovies.total_pages,
          hasPrevPage: parseInt(page) > 1
        }
      });
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

// Get movies by category
router.get('/category/:category', cacheMiddleware({ ttl: 300, keyPrefix: 'route' }), async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    // Try to get movies from database first
    try {
      const movies = await Movie.getByCategory(category, parseInt(limit));
      
      return res.json({
        success: true,
        data: movies,
        category
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for category:', category);
      
      // Fallback to TMDb API based on category
      let tmdbMovies;
      switch(category) {
        case 'popular':
          tmdbMovies = await tmdbService.getPopularMovies(1, 'en-US');
          break;
        case 'latest':
          tmdbMovies = await tmdbService.getTrendingMovies('day', 1); // Use daily trending for more variety
          break;
        case 'featured':
          tmdbMovies = await tmdbService.getTopRatedMovies(1, 'en-US');
          break;
        case 'Action':
          tmdbMovies = await tmdbService.getMoviesByGenre(28, 2, 'en-US'); // Action genre ID, page 2 for variety
          break;
        case 'Drama':
          tmdbMovies = await tmdbService.getMoviesByGenre(18, 3, 'en-US'); // Drama genre ID, page 3 for variety
          break;
        case 'Comedy':
          tmdbMovies = await tmdbService.getMoviesByGenre(35, 4, 'en-US'); // Comedy genre ID, page 4 for variety
          break;
        case 'Horror':
          tmdbMovies = await tmdbService.getMoviesByGenre(27, 5, 'en-US'); // Horror genre ID, page 5 for variety
          break;
        case 'Sci-Fi':
          tmdbMovies = await tmdbService.getMoviesByGenre(878, 6, 'en-US'); // Sci-Fi genre ID, page 6 for variety
          break;
        default:
          // For other genre categories, get popular movies and filter
          tmdbMovies = await tmdbService.getPopularMovies(1, 'en-US');
          break;
      }
      
      const movies = tmdbMovies.results ? 
        tmdbMovies.results.slice(0, parseInt(limit)).map(movie => tmdbService.transformMovieData(movie)) : 
        [];
      
      return res.json({
        success: true,
        data: movies,
        category
      });
    }
  } catch (error) {
    console.error('Error fetching movies by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

// Search movies
router.get('/search', cacheMiddleware({ ttl: 300, keyPrefix: 'route' }), async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    // Try to search in database first
    try {
      const movies = await Movie.search(q.trim(), parseInt(limit));
      
      return res.json({
        success: true,
        data: movies,
        query: q,
        count: movies.length
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for search');
      
      // Fallback to TMDb API search
      const tmdbMovies = await tmdbService.searchMovies(q.trim(), 1, 'en-US');
      const movies = tmdbMovies.results ? 
        tmdbMovies.results.slice(0, parseInt(limit)).map(movie => tmdbService.transformMovieData(movie)) : 
        [];
      
      return res.json({
        success: true,
        data: movies,
        query: q,
        count: movies.length
      });
    }
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ success: false, error: 'Failed to search movies' });
  }
});

// Get movie by ID
router.get('/:id', cacheMiddleware({ ttl: 3600, keyPrefix: 'route' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get movie from database first
    try {
      const movie = await Movie.findById(id);
      
      if (movie) {
        // Increment view count
        await movie.incrementViews();

        // Check if streaming URLs are available
        const hasStreamingUrls = movie.streamingUrls && movie.streamingUrls.length > 0;
        
        // If no streaming URLs, try to get from Telegram
        if (!hasStreamingUrls) {
          try {
            const backupResult = await telegramService.addBackupStreamingUrl(id);
            if (backupResult.success) {
              // Refresh movie data
              await movie.reload();
            }
          } catch (telegramError) {
            console.error('Telegram backup failed:', telegramError);
          }
        }

        return res.json({
          success: true,
          data: movie
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for movie details');
    }
    
    // Fallback to TMDb API
    try {
      const tmdbMovie = await tmdbService.getMovieDetails(id, 'en-US');
      const movie = tmdbService.transformMovieData(tmdbMovie);
      
      return res.json({
        success: true,
        data: movie
      });
    } catch (tmdbError) {
      console.error('TMDb API error:', tmdbError);
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
});

// Get streaming URLs for a movie
router.get('/:id/stream', cacheMiddleware({ ttl: 3600, keyPrefix: 'route' }), async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.query;
    
    const movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    // Filter streaming URLs by quality if specified
    let streamingUrls = movie.streamingUrls.filter(url => url.isActive);
    
    if (quality) {
      streamingUrls = streamingUrls.filter(url => url.quality === quality);
    }

    // If no streaming URLs available, try Telegram
    if (streamingUrls.length === 0) {
      try {
        const backupResult = await telegramService.addBackupStreamingUrl(id);
        if (backupResult.success) {
          // Refresh movie data
          await movie.reload();
          streamingUrls = movie.streamingUrls.filter(url => url.isActive);
        }
      } catch (telegramError) {
        console.error('Telegram backup failed:', telegramError);
      }
    }

    res.json({
      success: true,
      data: {
        movieId: id,
        title: movie.title,
        streamingUrls,
        primaryUrl: movie.primaryStreamingUrl
      }
    });
  } catch (error) {
    console.error('Error fetching streaming URLs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch streaming URLs' });
  }
});

// Get genres
router.get('/genres/list', cacheMiddleware({ ttl: 3600, keyPrefix: 'route' }), async (req, res) => {
  try {
    // Try to get genres from database first
    try {
      const genres = await Movie.distinct('genre');
      
      return res.json({
        success: true,
        data: genres.sort()
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for genres');
      
      // Fallback to TMDb API - get popular movies and extract genres
      const tmdbMovies = await tmdbService.getPopularMovies(1, 'en-US');
      const genres = [...new Set(tmdbMovies.results.flatMap(movie => movie.genre_ids || []))];
      
      // Convert genre IDs to names (you can expand this mapping)
      const genreNames = genres.map(id => {
        const genreMap = {
          28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
          80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
          14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
          9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
          10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
        };
        return genreMap[id] || `Genre ${id}`;
      });
      
      return res.json({
        success: true,
        data: genreNames.sort()
      });
    }
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch genres' });
  }
});

// Get years
router.get('/years/list', cacheMiddleware({ ttl: 3600, keyPrefix: 'route' }), async (req, res) => {
  try {
    // Try to get years from database first
    try {
      const years = await Movie.distinct('year');
      
      return res.json({
        success: true,
        data: years.sort((a, b) => b - a) // Sort descending
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for years');
      
      // Fallback to TMDb API - get popular movies and extract years
      const tmdbMovies = await tmdbService.getPopularMovies(1, 'en-US');
      const years = [...new Set(tmdbMovies.results.map(movie => 
        new Date(movie.release_date).getFullYear()
      ))].filter(year => year > 1900);
      
      return res.json({
        success: true,
        data: years.sort((a, b) => b - a) // Sort descending
      });
    }
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch years' });
  }
});

// Admin routes (protected)
// Create new movie
router.post('/', auth, invalidateCacheMiddleware(['route:/api/movies*']), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('genre').isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('poster').isURL().withMessage('Valid poster URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const movie = new Movie(req.body);
    await movie.save();

    res.status(201).json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ success: false, error: 'Failed to create movie' });
  }
});

// Update movie
router.put('/:id', auth, invalidateCacheMiddleware(['route:/api/movies*']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ success: false, error: 'Failed to update movie' });
  }
});

// Delete movie
router.delete('/:id', auth, invalidateCacheMiddleware(['route:/api/movies*']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    res.json({
      success: true,
      message: 'Movie deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ success: false, error: 'Failed to delete movie' });
  }
});

// Add streaming URL to movie
router.post('/:id/streaming-urls', auth, invalidateCacheMiddleware(['route:/api/movies*']), [
  body('url').isURL().withMessage('Valid URL is required'),
  body('quality').isIn(['1080p', '720p', '480p', '360p']).withMessage('Invalid quality'),
  body('source').isIn(['local', 'telegram', 'external']).withMessage('Invalid source')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    const newStreamingUrl = {
      ...req.body,
      isActive: true,
      addedAt: new Date()
    };

    movie.streamingUrls.push(newStreamingUrl);
    await movie.save();

    res.json({
      success: true,
      data: newStreamingUrl
    });
  } catch (error) {
    console.error('Error adding streaming URL:', error);
    res.status(500).json({ success: false, error: 'Failed to add streaming URL' });
  }
});

// Update streaming URL
router.put('/:id/streaming-urls/:urlId', auth, invalidateCacheMiddleware(['route:/api/movies*']), async (req, res) => {
  try {
    const { id, urlId } = req.params;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    const streamingUrl = movie.streamingUrls.id(urlId);
    if (!streamingUrl) {
      return res.status(404).json({ success: false, error: 'Streaming URL not found' });
    }

    Object.assign(streamingUrl, req.body);
    await movie.save();

    res.json({
      success: true,
      data: streamingUrl
    });
  } catch (error) {
    console.error('Error updating streaming URL:', error);
    res.status(500).json({ success: false, error: 'Failed to update streaming URL' });
  }
});

// Delete streaming URL
router.delete('/:id/streaming-urls/:urlId', auth, invalidateCacheMiddleware(['route:/api/movies*']), async (req, res) => {
  try {
    const { id, urlId } = req.params;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    movie.streamingUrls = movie.streamingUrls.filter(url => url._id.toString() !== urlId);
    await movie.save();

    res.json({
      success: true,
      message: 'Streaming URL deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting streaming URL:', error);
    res.status(500).json({ success: false, error: 'Failed to delete streaming URL' });
  }
});

// Cache metrics endpoint (admin only)
router.get('/admin/cache/metrics', auth, async (req, res) => {
  try {
    const { getCacheMetrics } = require('../middleware/cacheMiddleware');
    const cacheService = require('../services/cacheService');
    
    const metrics = getCacheMetrics();
    const cacheStats = await cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        metrics,
        cacheStats
      }
    });
  } catch (error) {
    console.error('Error fetching cache metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cache metrics' });
  }
});

// Warm cache endpoint (admin only)
router.post('/admin/cache/warm', auth, async (req, res) => {
  try {
    const { warmCache } = require('../middleware/cacheMiddleware');
    await warmCache();
    
    res.json({
      success: true,
      message: 'Cache warming initiated'
    });
  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({ success: false, error: 'Failed to warm cache' });
  }
});

// Clear cache endpoint (admin only)
router.delete('/admin/cache/clear', auth, async (req, res) => {
  try {
    const cacheService = require('../services/cacheService');
    const { pattern = 'route:/api/movies*' } = req.query;
    
    const deletedCount = await cacheService.delPattern(pattern);
    
    res.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      pattern
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

module.exports = router; 