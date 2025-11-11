const cacheService = require('./cacheService');
const Movie = require('../models/Movie');
const User = require('../models/User');

/**
 * SessionManager - Manages user viewing sessions and progress tracking
 * Features:
 * - Real-time progress tracking with Redis
 * - Batch updates to MongoDB for persistence
 * - Session management with TTL
 * - Offline progress queueing
 */
class SessionManager {
  constructor() {
    this.cacheService = cacheService;
    
    // Session TTL: 24 hours
    this.sessionTTL = 86400;
    
    // Progress update TTL: 7 days
    this.progressTTL = 604800;
    
    // Batch update queue
    this.updateQueue = new Map();
    
    // Batch update interval: 30 seconds
    this.batchInterval = 30000;
    
    // Start batch update worker
    this.startBatchWorker();
    
    console.log('SessionManager initialized');
  }

  /**
   * Start a new viewing session
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @param {Object} metadata - Session metadata
   * @returns {Promise<Object>} Session data
   */
  async startSession(userId, movieId, metadata = {}) {
    try {
      const sessionId = this.generateSessionId(userId, movieId);
      const sessionKey = this.buildSessionKey(sessionId);
      
      const session = {
        sessionId,
        userId,
        movieId,
        startTime: Date.now(),
        lastUpdate: Date.now(),
        currentPosition: 0,
        duration: metadata.duration || 0,
        quality: metadata.quality || 'auto',
        provider: metadata.provider || 'unknown',
        isActive: true,
        metadata
      };

      // Store session in Redis
      await this.cacheService.set(sessionKey, session, this.sessionTTL);
      
      console.log(`Session started: ${sessionId} for user ${userId}, movie ${movieId}`);
      
      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('Start session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update viewing progress
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @param {Object} progress - Progress data
   * @returns {Promise<Object>} Update result
   */
  async updateProgress(userId, movieId, progress) {
    try {
      const sessionId = this.generateSessionId(userId, movieId);
      const sessionKey = this.buildSessionKey(sessionId);
      const progressKey = this.buildProgressKey(userId, movieId);

      // Get current session
      let session = await this.cacheService.get(sessionKey);
      
      if (!session) {
        // Create new session if not exists
        const startResult = await this.startSession(userId, movieId, {
          duration: progress.duration
        });
        session = startResult.session;
      }

      // Update session data
      session.lastUpdate = Date.now();
      session.currentPosition = progress.currentTime || 0;
      session.duration = progress.duration || session.duration;
      session.progress = progress.progress || 0;

      // Store updated session in Redis
      await this.cacheService.set(sessionKey, session, this.sessionTTL);

      // Store progress separately for longer persistence
      const progressData = {
        userId,
        movieId,
        currentPosition: session.currentPosition,
        duration: session.duration,
        progress: session.progress,
        lastUpdate: session.lastUpdate,
        sessionId
      };

      await this.cacheService.set(progressKey, progressData, this.progressTTL);

      // Add to batch update queue for database persistence
      this.queueDatabaseUpdate(userId, movieId, progressData);

      return {
        success: true,
        session,
        progress: progressData
      };
    } catch (error) {
      console.error('Update progress error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get viewing progress for a movie
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @returns {Promise<Object>} Progress data
   */
  async getProgress(userId, movieId) {
    try {
      const progressKey = this.buildProgressKey(userId, movieId);
      
      // Try to get from Redis first
      let progress = await this.cacheService.get(progressKey);
      
      if (progress) {
        return {
          success: true,
          data: progress,
          source: 'cache'
        };
      }

      // Fallback to database
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const historyItem = user.watchHistory.find(
        item => item.movieId.toString() === movieId
      );

      if (historyItem) {
        progress = {
          userId,
          movieId,
          currentPosition: historyItem.lastPosition || 0,
          duration: historyItem.duration || 0,
          progress: historyItem.progress || 0,
          lastUpdate: historyItem.lastWatched?.getTime() || Date.now()
        };

        // Cache the progress from database
        await this.cacheService.set(progressKey, progress, this.progressTTL);

        return {
          success: true,
          data: progress,
          source: 'database'
        };
      }

      return {
        success: true,
        data: null,
        source: 'none'
      };
    } catch (error) {
      console.error('Get progress error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * End a viewing session
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @returns {Promise<Object>} Result
   */
  async endSession(userId, movieId) {
    try {
      const sessionId = this.generateSessionId(userId, movieId);
      const sessionKey = this.buildSessionKey(sessionId);

      // Get session data
      const session = await this.cacheService.get(sessionKey);
      
      if (session) {
        session.isActive = false;
        session.endTime = Date.now();
        session.totalWatchTime = session.endTime - session.startTime;

        // Update session in Redis
        await this.cacheService.set(sessionKey, session, 3600); // Keep for 1 hour

        // Force immediate database update
        const progressKey = this.buildProgressKey(userId, movieId);
        const progress = await this.cacheService.get(progressKey);
        
        if (progress) {
          await this.persistToDatabase(userId, movieId, progress);
        }

        console.log(`Session ended: ${sessionId}`);
      }

      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('End session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Queue progress update for batch database persistence
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @param {Object} progressData - Progress data
   */
  queueDatabaseUpdate(userId, movieId, progressData) {
    const queueKey = `${userId}:${movieId}`;
    this.updateQueue.set(queueKey, {
      userId,
      movieId,
      progressData,
      queuedAt: Date.now()
    });
  }

  /**
   * Start batch update worker
   */
  startBatchWorker() {
    setInterval(async () => {
      await this.flushPendingUpdates();
    }, this.batchInterval);
    
    console.log(`Batch update worker started (interval: ${this.batchInterval}ms)`);
  }

  /**
   * Flush pending updates to database
   * @returns {Promise<Object>} Flush result
   */
  async flushPendingUpdates() {
    if (this.updateQueue.size === 0) {
      return {
        success: true,
        flushed: 0
      };
    }

    const updates = Array.from(this.updateQueue.values());
    this.updateQueue.clear();

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        await this.persistToDatabase(
          update.userId,
          update.movieId,
          update.progressData
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to persist update for ${update.userId}:${update.movieId}:`, error);
        errorCount++;
      }
    }

    console.log(`Flushed ${successCount} updates to database (${errorCount} errors)`);

    return {
      success: true,
      flushed: successCount,
      errors: errorCount
    };
  }

  /**
   * Persist progress to database
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<boolean>} Success status
   */
  async persistToDatabase(userId, movieId, progressData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find existing history item
      const historyIndex = user.watchHistory.findIndex(
        item => item.movieId.toString() === movieId
      );

      const historyItem = {
        movieId,
        lastWatched: new Date(),
        progress: progressData.progress || 0,
        duration: progressData.duration || 0,
        lastPosition: progressData.currentPosition || 0
      };

      if (historyIndex >= 0) {
        // Update existing item
        user.watchHistory[historyIndex] = historyItem;
      } else {
        // Add new item
        user.watchHistory.push(historyItem);
      }

      await user.save();
      return true;
    } catch (error) {
      console.error('Persist to database error:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active sessions
   */
  async getActiveSessions(userId) {
    try {
      // This would require scanning Redis keys, which is not ideal
      // For now, return empty array
      // In production, consider maintaining a separate index of active sessions
      return {
        success: true,
        sessions: []
      };
    } catch (error) {
      console.error('Get active sessions error:', error);
      return {
        success: false,
        error: error.message,
        sessions: []
      };
    }
  }

  /**
   * Generate session ID
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @returns {string} Session ID
   */
  generateSessionId(userId, movieId) {
    return `${userId}:${movieId}:${Date.now()}`;
  }

  /**
   * Build session cache key
   * @param {string} sessionId - Session ID
   * @returns {string} Cache key
   */
  buildSessionKey(sessionId) {
    return `session:${sessionId}`;
  }

  /**
   * Build progress cache key
   * @param {string} userId - User ID
   * @param {string} movieId - Movie ID
   * @returns {string} Cache key
   */
  buildProgressKey(userId, movieId) {
    return `progress:${userId}:${movieId}`;
  }

  /**
   * Get session manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      queueSize: this.updateQueue.size,
      batchInterval: this.batchInterval,
      sessionTTL: this.sessionTTL,
      progressTTL: this.progressTTL
    };
  }
}

// Export singleton instance
module.exports = new SessionManager();
