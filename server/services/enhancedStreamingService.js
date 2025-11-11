const vidkingService = require('./vidkingService');
const streamingService = require('./streamingService');
const cacheService = require('./cacheService');

/**
 * EnhancedStreamingService
 * Provides unified streaming source management with:
 * - VidKing as primary provider
 * - Fallback to existing providers
 * - Source prioritization and quality selection
 * - Redis caching with appropriate TTL
 * - Graceful degradation
 */
class EnhancedStreamingService {
  constructor() {
    this.primaryProvider = vidkingService;
    this.fallbackProvider = streamingService;
    this.cacheService = cacheService;
    
    // Cache TTL for streaming sources (1 hour)
    this.sourceCacheTTL = 3600;
    
    // Source priority weights
    this.priorityWeights = {
      provider: {
        vidking: 100,
        vidsrc: 80,
        vidsrcPk: 75,
        embedSu: 70,
        superEmbed: 65,
        sflix: 60,
        watchSeries: 55
      },
      quality: {
        '2160p': 50,
        '1440p': 45,
        '1080p': 40,
        '720p': 30,
        '480p': 20,
        '360p': 10,
        '240p': 5
      },
      type: {
        'hls': 40,
        'dash': 35,
        'direct': 30,
        'embed': 20,
        'iframe': 10
      }
    };

    console.log('EnhancedStreamingService initialized with VidKing as primary provider');
  }

  /**
   * Get streaming sources for a movie with caching and fallback
   * @param {string} movieId - Movie ID (TMDb ID)
   * @param {string} movieTitle - Movie title
   * @param {number} year - Release year
   * @param {string} imdbId - IMDb ID (optional)
   * @returns {Promise<Object>} Streaming sources with metadata
   */
  async getSources(movieId, movieTitle, year = null, imdbId = null) {
    try {
      // Check cache first
      const cacheKey = this.buildCacheKey(movieId);
      const cachedSources = await this.cacheService.get(cacheKey);
      
      if (cachedSources) {
        console.log(`Cache hit for movie ${movieId}`);
        return {
          success: true,
          sources: cachedSources.sources,
          metadata: {
            ...cachedSources.metadata,
            cached: true,
            cacheAge: Date.now() - cachedSources.timestamp
          }
        };
      }

      console.log(`Cache miss for movie ${movieId}, fetching from providers`);

      // Fetch from primary provider (VidKing)
      let sources = [];
      let primarySuccess = false;
      
      if (this.primaryProvider.isEnabled()) {
        try {
          const vidkingSources = await this.primaryProvider.getSources(movieId, 'movie');
          if (vidkingSources && vidkingSources.length > 0) {
            sources = sources.concat(vidkingSources);
            primarySuccess = true;
            console.log(`VidKing returned ${vidkingSources.length} sources`);
          }
        } catch (error) {
          console.warn('VidKing provider failed:', error.message);
        }
      }

      // Fallback to existing providers if primary fails or returns no sources
      if (!primarySuccess || sources.length === 0) {
        console.log('Falling back to existing providers');
        try {
          const fallbackResult = await this.fallbackProvider.getMovieSources(
            movieId,
            movieTitle,
            year
          );
          
          if (fallbackResult.success) {
            const fallbackSources = this.transformFallbackSources(fallbackResult.data);
            sources = sources.concat(fallbackSources);
            console.log(`Fallback providers returned ${fallbackSources.length} sources`);
          }
        } catch (error) {
          console.error('Fallback provider failed:', error.message);
        }
      }

      // If still no sources, return error
      if (sources.length === 0) {
        return {
          success: false,
          error: 'No streaming sources available',
          sources: [],
          metadata: {
            movieId,
            movieTitle,
            year,
            timestamp: Date.now(),
            primaryProvider: 'vidking',
            primarySuccess: false,
            fallbackAttempted: true
          }
        };
      }

      // Prioritize and sort sources
      const prioritizedSources = this.prioritizeSources(sources);

      // Prepare result
      const result = {
        sources: prioritizedSources,
        metadata: {
          movieId,
          movieTitle,
          year,
          timestamp: Date.now(),
          totalSources: prioritizedSources.length,
          primaryProvider: 'vidking',
          primarySuccess,
          fallbackUsed: !primarySuccess || sources.length > (primarySuccess ? 1 : 0),
          qualityBreakdown: this.getQualityBreakdown(prioritizedSources),
          providerBreakdown: this.getProviderBreakdown(prioritizedSources)
        }
      };

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.sourceCacheTTL);
      console.log(`Cached ${prioritizedSources.length} sources for movie ${movieId}`);

      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('EnhancedStreamingService.getSources error:', error);
      return {
        success: false,
        error: error.message,
        sources: [],
        metadata: {
          movieId,
          movieTitle,
          year,
          timestamp: Date.now(),
          error: error.message
        }
      };
    }
  }

  /**
   * Get embed URL for a movie (convenience method)
   * @param {string} movieId - Movie ID (TMDb ID)
   * @param {string} movieTitle - Movie title
   * @param {number} year - Release year
   * @returns {Promise<Object>} Primary embed URL
   */
  async getEmbedUrl(movieId, movieTitle, year = null) {
    try {
      // Try VidKing first
      if (this.primaryProvider.isEnabled()) {
        try {
          const embedUrl = await this.primaryProvider.getEmbedUrl(movieId, 'movie');
          return {
            success: true,
            url: embedUrl,
            provider: 'vidking',
            quality: '1080p',
            type: 'embed'
          };
        } catch (error) {
          console.warn('VidKing embed URL failed:', error.message);
        }
      }

      // Fallback to existing providers
      const sources = await this.getSources(movieId, movieTitle, year);
      if (sources.success && sources.sources.length > 0) {
        const bestSource = sources.sources[0];
        return {
          success: true,
          url: bestSource.url,
          provider: bestSource.provider,
          quality: bestSource.quality,
          type: bestSource.type
        };
      }

      return {
        success: false,
        error: 'No embed URL available'
      };

    } catch (error) {
      console.error('EnhancedStreamingService.getEmbedUrl error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Transform fallback sources to standardized format
   * @param {Object} fallbackData - Data from fallback provider
   * @returns {Array} Standardized sources
   */
  transformFallbackSources(fallbackData) {
    const sources = [];

    // Transform streaming sources
    if (fallbackData.streaming && fallbackData.streaming.data) {
      fallbackData.streaming.data.forEach(providerData => {
        if (providerData.links && Array.isArray(providerData.links)) {
          providerData.links.forEach(link => {
            sources.push({
              url: link.url,
              quality: link.quality || '1080p',
              type: link.type || 'direct',
              language: link.language || 'en',
              provider: providerData.provider || 'unknown',
              subtitles: [],
              isWorking: true,
              priority: 0, // Will be calculated later
              metadata: {
                server: providerData.provider,
                lastChecked: new Date().toISOString()
              }
            });
          });
        }
      });
    }

    // Transform embed sources
    if (fallbackData.embed && fallbackData.embed.data) {
      fallbackData.embed.data.forEach(embedData => {
        sources.push({
          url: embedData.url,
          quality: embedData.quality || '720p',
          type: embedData.type || 'embed',
          language: 'en',
          provider: embedData.provider || 'unknown',
          subtitles: [],
          isWorking: true,
          priority: 0, // Will be calculated later
          metadata: {
            server: embedData.provider,
            lastChecked: new Date().toISOString()
          }
        });
      });
    }

    return sources;
  }

  /**
   * Prioritize sources based on provider, quality, and type
   * @param {Array} sources - Array of sources
   * @returns {Array} Sorted sources by priority
   */
  prioritizeSources(sources) {
    return sources
      .map(source => ({
        ...source,
        priority: this.calculateSourcePriority(source)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate priority score for a source
   * @param {Object} source - Source object
   * @returns {number} Priority score
   */
  calculateSourcePriority(source) {
    let priority = 0;

    // Provider priority
    const provider = source.provider?.toLowerCase() || 'unknown';
    priority += this.priorityWeights.provider[provider] || 50;

    // Quality priority
    const quality = source.quality?.toLowerCase() || 'unknown';
    priority += this.priorityWeights.quality[quality] || 0;

    // Type priority
    const type = source.type?.toLowerCase() || 'unknown';
    priority += this.priorityWeights.type[type] || 0;

    // Bonus for working sources
    if (source.isWorking) {
      priority += 10;
    }

    // Bonus for sources with subtitles
    if (source.subtitles && source.subtitles.length > 0) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Get quality breakdown of sources
   * @param {Array} sources - Array of sources
   * @returns {Object} Quality breakdown
   */
  getQualityBreakdown(sources) {
    const breakdown = {};
    sources.forEach(source => {
      const quality = source.quality || 'unknown';
      breakdown[quality] = (breakdown[quality] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get provider breakdown of sources
   * @param {Array} sources - Array of sources
   * @returns {Object} Provider breakdown
   */
  getProviderBreakdown(sources) {
    const breakdown = {};
    sources.forEach(source => {
      const provider = source.provider || 'unknown';
      breakdown[provider] = (breakdown[provider] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Build cache key for movie sources
   * @param {string} movieId - Movie ID
   * @returns {string} Cache key
   */
  buildCacheKey(movieId) {
    return `${this.cacheService.keyPrefixes.STREAMING_SOURCES}:${movieId}`;
  }

  /**
   * Invalidate cache for a specific movie
   * @param {string} movieId - Movie ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCache(movieId) {
    const cacheKey = this.buildCacheKey(movieId);
    return await this.cacheService.del(cacheKey);
  }

  /**
   * Invalidate all streaming source caches
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateAllCaches() {
    const pattern = `${this.cacheService.keyPrefixes.STREAMING_SOURCES}:*`;
    return await this.cacheService.delPattern(pattern);
  }

  /**
   * Get service status
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    const primaryStatus = await this.primaryProvider.checkStatus();
    const cacheAvailable = this.cacheService.isAvailable();

    return {
      service: 'EnhancedStreamingService',
      status: 'operational',
      timestamp: new Date().toISOString(),
      providers: {
        primary: {
          name: 'vidking',
          enabled: this.primaryProvider.isEnabled(),
          available: primaryStatus.available,
          status: primaryStatus
        },
        fallback: {
          name: 'legacy-providers',
          enabled: true,
          available: true
        }
      },
      cache: {
        enabled: cacheAvailable,
        available: cacheAvailable,
        ttl: this.sourceCacheTTL
      }
    };
  }

  /**
   * Test all providers and return availability
   * @returns {Promise<Object>} Provider test results
   */
  async testProviders() {
    const results = {
      timestamp: new Date().toISOString(),
      providers: {}
    };

    // Test VidKing
    try {
      const vidkingStatus = await this.primaryProvider.checkStatus();
      results.providers.vidking = {
        available: vidkingStatus.available,
        enabled: this.primaryProvider.isEnabled(),
        responseTime: vidkingStatus.responseTime || 'N/A',
        status: vidkingStatus
      };
    } catch (error) {
      results.providers.vidking = {
        available: false,
        enabled: this.primaryProvider.isEnabled(),
        error: error.message
      };
    }

    // Test fallback providers
    try {
      const fallbackTests = await this.fallbackProvider.testProviders();
      results.providers.fallback = fallbackTests;
    } catch (error) {
      results.providers.fallback = {
        error: error.message
      };
    }

    return results;
  }
}

// Export singleton instance
module.exports = new EnhancedStreamingService();
