const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');
const Movie = require('../models/Movie');
const auth = require('../middleware/auth');

// Test Telegram connection
router.get('/test', async (req, res) => {
  try {
    const result = await telegramService.testConnection();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Telegram test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Telegram connection'
    });
  }
});

// Get channel statistics
router.get('/channel-stats', async (req, res) => {
  try {
    const stats = await telegramService.getChannelStats();
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Channel statistics not available'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Channel stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel statistics'
    });
  }
});

// Search for movie in Telegram channel
router.get('/search/:movieTitle', async (req, res) => {
  try {
    const { movieTitle } = req.params;
    const { year } = req.query;
    
    if (!movieTitle || movieTitle.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Movie title must be at least 2 characters long'
      });
    }
    
    const results = await telegramService.searchMovieInChannel(movieTitle.trim(), year);
    
    res.json({
      success: true,
      data: {
        query: movieTitle,
        year,
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error('Telegram search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search Telegram channel'
    });
  }
});

// Add backup streaming URL for a movie
router.post('/backup/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const result = await telegramService.addBackupStreamingUrl(movieId);
    
    res.json({
      success: result.success,
      data: result.streamingUrl,
      message: result.message
    });
  } catch (error) {
    console.error('Backup streaming URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add backup streaming URL'
    });
  }
});

// Validate streaming URL
router.post('/validate-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const validation = await telegramService.validateStreamingUrl(url);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('URL validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate URL'
    });
  }
});

// Get streaming URL for a file
router.get('/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
    }
    
    const streamingInfo = await telegramService.getStreamingUrl(fileId);
    
    res.json({
      success: true,
      data: streamingInfo
    });
  } catch (error) {
    console.error('Streaming URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streaming URL'
    });
  }
});

// Update movie with Telegram data
router.put('/movie/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { fileId, messageId } = req.body;
    
    if (!fileId || !messageId) {
      return res.status(400).json({
        success: false,
        error: 'File ID and Message ID are required'
      });
    }
    
    const result = await telegramService.updateMovieWithTelegramData(movieId, {
      fileId,
      messageId
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Movie updated successfully' : result.error
    });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update movie'
    });
  }
});

// Get movies with Telegram backup
router.get('/movies/backup', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const movies = await Movie.find({
      telegramFileId: { $exists: true, $ne: null }
    })
    .select('title poster year telegramFileId telegramMessageId')
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Movie.countDocuments({
      telegramFileId: { $exists: true, $ne: null }
    });
    
    res.json({
      success: true,
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Backup movies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backup movies'
    });
  }
});

// Bulk add backup URLs for movies without streaming
router.post('/bulk-backup', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    
    // Find movies without streaming URLs
    const moviesWithoutStreaming = await Movie.find({
      $or: [
        { streamingUrls: { $size: 0 } },
        { streamingUrls: { $exists: false } }
      ],
      isActive: true
    })
    .limit(parseInt(limit))
    .select('title year');
    
    const results = [];
    
    for (const movie of moviesWithoutStreaming) {
      try {
        const result = await telegramService.addBackupStreamingUrl(movie._id);
        results.push({
          movieId: movie._id,
          title: movie.title,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        results.push({
          movieId: movie._id,
          title: movie.title,
          success: false,
          message: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      data: {
        processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk backup'
    });
  }
});

// Get Telegram configuration status
router.get('/config', async (req, res) => {
  try {
    const config = {
      botToken: !!process.env.TELEGRAM_BOT_TOKEN,
      apiToken: !!process.env.TELEGRAM_API_TOKEN,
      channelId: !!process.env.TELEGRAM_CHANNEL_ID,
      isConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && 
                      process.env.TELEGRAM_API_TOKEN && 
                      process.env.TELEGRAM_CHANNEL_ID)
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

// Health check for Telegram service
router.get('/health', async (req, res) => {
  try {
    const connectionTest = await telegramService.testConnection();
    const channelStats = await telegramService.getChannelStats();
    
    const health = {
      service: 'telegram',
      status: connectionTest.connected ? 'healthy' : 'unhealthy',
      connection: connectionTest,
      channel: channelStats ? 'available' : 'unavailable',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: {
        service: 'telegram',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router; 