const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const User = require('../models/User');

// Track page views and user interactions (privacy-focused)
router.post('/track', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // Simple event tracking without storing personal data
    console.log('Analytics event:', event, data);
    
    // For now, just acknowledge the tracking
    // In production, you might want to store anonymized data
    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

// Get basic site statistics (privacy-focused)
router.get('/stats', async (req, res) => {
  try {
    // Try to get stats from database first
    try {
      const [
        totalMovies,
        activeMovies,
        totalUsers,
        totalViews,
        popularMovies,
        recentMovies
      ] = await Promise.all([
        Movie.countDocuments(),
        Movie.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: true }),
        Movie.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]),
        Movie.find({ isActive: true })
          .sort({ views: -1 })
          .limit(5)
          .select('title poster views'),
        Movie.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title poster year')
      ]);

      const stats = {
        movies: {
          total: totalMovies,
          active: activeMovies
        },
        users: {
          total: totalUsers
        },
        views: {
          total: totalViews[0]?.totalViews || 0
        },
        popular: popularMovies,
        recent: recentMovies,
        timestamp: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: stats
      });
    } catch (dbError) {
      console.log('Database not available, falling back to TMDb API for analytics');
      
      // Fallback to TMDb API for basic stats
      const tmdbService = require('../services/tmdbService');
      const popularMovies = await tmdbService.getPopularMovies(1, 'en-US');
      
      const stats = {
        movies: {
          total: popularMovies.total_results || 0,
          active: popularMovies.results?.length || 0
        },
        users: {
          total: 0 // No user data available from TMDb
        },
        views: {
          total: popularMovies.results?.reduce((sum, movie) => sum + (movie.popularity || 0), 0) || 0
        },
        popular: popularMovies.results?.slice(0, 5).map(movie => ({
          title: movie.title,
          poster: tmdbService.getPosterURL(movie.poster_path),
          views: Math.floor(movie.popularity || 0)
        })) || [],
        recent: popularMovies.results?.slice(0, 5).map(movie => ({
          title: movie.title,
          poster: tmdbService.getPosterURL(movie.poster_path),
          year: new Date(movie.release_date).getFullYear()
        })) || [],
        timestamp: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: stats
      });
    }
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router; 