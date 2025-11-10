const axios = require('axios');

/**
 * VidKing API Service
 * Provides unified API for accessing multiple streaming sources
 * Documentation: https://www.vidking.net/api/docs
 */
class VidKingService {
  constructor() {
    // VidKing works with direct embed URLs - no API key needed!
    this.baseUrl = process.env.VIDKING_BASE_URL || 'https://www.vidking.net';
    this.embedBaseUrl = 'https://www.vidking.net/embed';
    this.apiKey = process.env.VIDKING_API_KEY; // Optional - for advanced features
    this.timeout = parseInt(process.env.VIDKING_TIMEOUT) || 10000;
    this.enabled = process.env.VIDKING_ENABLED !== 'false'; // Enabled by default
    
    console.log('VidKing Service initialized:', {
      enabled: this.enabled,
      hasApiKey: !!this.apiKey,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Get streaming sources for a movie or TV show
   * VidKing uses direct embed URLs - no API needed!
   * @param {string} tmdbId - TMDb ID of the content
   * @param {string} type - Content type: 'movie' or 'tv'
   * @param {number} season - Season number (for TV shows only)
   * @param {number} episode - Episode number (for TV shows only)
   * @returns {Promise<Array>} Array of streaming sources
   */
  async getSources(tmdbId, type = 'movie', season = null, episode = null) {
    if (!this.enabled) {
      throw new Error('VidKing service is not enabled');
    }

    try {
      // VidKing uses direct embed URLs based on TMDb ID
      const embedUrl = this.buildEmbedUrl(tmdbId, type, season, episode);
      
      // Test if the embed URL is accessible
      const isAccessible = await this.testEmbedUrl(embedUrl);
      
      if (isAccessible) {
        return [{
          url: embedUrl,
          quality: '1080p',
          type: 'embed',
          language: 'en',
          provider: 'vidking',
          subtitles: [],
          isWorking: true,
          priority: 90, // High priority
          metadata: {
            server: 'vidking',
            lastChecked: new Date().toISOString(),
            tmdbId: tmdbId
          }
        }];
      }

      return [];
    } catch (error) {
      console.error('VidKing getSources error:', error.message);
      return [];
    }
  }

  /**
   * Build VidKing embed URL from TMDb ID
   * @param {string} tmdbId - TMDb ID
   * @param {string} type - 'movie' or 'tv'
   * @param {number} season - Season number (for TV)
   * @param {number} episode - Episode number (for TV)
   * @returns {string} Embed URL
   */
  buildEmbedUrl(tmdbId, type = 'movie', season = null, episode = null) {
    if (type === 'tv' && season !== null && episode !== null) {
      return `${this.embedBaseUrl}/tv/${tmdbId}/${season}/${episode}`;
    }
    return `${this.embedBaseUrl}/${type}/${tmdbId}`;
  }

  /**
   * Test if an embed URL is accessible
   * @param {string} url - URL to test
   * @returns {Promise<boolean>} True if accessible
   */
  async testEmbedUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.status === 200;
    } catch (error) {
      // Even if HEAD fails, the embed might work
      return true; // Optimistically return true
    }
  }

  /**
   * Transform VidKing sources to standardized format
   * @param {Array} sources - Raw sources from VidKing API
   * @returns {Array} Transformed sources with priority sorting
   */
  transformSources(sources) {
    if (!Array.isArray(sources)) {
      return [];
    }

    return sources
      .map(source => ({
        url: source.url,
        quality: source.quality || '1080p',
        type: source.type || 'embed',  // 'embed', 'direct', 'hls', 'dash'
        language: source.language || 'en',
        provider: 'vidking',
        subtitles: source.subtitles || [],
        isWorking: source.status === 'active' || source.status === undefined,
        priority: this.getSourcePriority(source),
        metadata: {
          server: source.server || 'unknown',
          lastChecked: source.lastChecked || new Date().toISOString()
        }
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate source priority based on quality and type
   * Higher priority sources are preferred
   * @param {Object} source - Source object
   * @returns {number} Priority score
   */
  getSourcePriority(source) {
    let priority = 0;

    // Type priority (HLS/DASH > Direct > Embed)
    const typeScores = {
      'hls': 40,
      'dash': 35,
      'direct': 30,
      'embed': 20,
      'iframe': 10
    };
    priority += typeScores[source.type?.toLowerCase()] || 0;

    // Quality priority
    const qualityScores = {
      '2160p': 50,
      '1440p': 45,
      '1080p': 40,
      '720p': 30,
      '480p': 20,
      '360p': 10,
      '240p': 5
    };
    priority += qualityScores[source.quality] || 0;

    // Bonus for working sources
    if (source.status === 'active') {
      priority += 10;
    }

    // Bonus for sources with subtitles
    if (source.subtitles && source.subtitles.length > 0) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Get embed URL for a movie or TV show
   * Simple method - just builds the URL directly
   * @param {string} tmdbId - TMDb ID of the content
   * @param {string} type - Content type: 'movie' or 'tv'
   * @param {number} season - Season number (for TV shows only)
   * @param {number} episode - Episode number (for TV shows only)
   * @returns {Promise<string>} Embed URL
   */
  async getEmbedUrl(tmdbId, type = 'movie', season = null, episode = null) {
    if (!this.enabled) {
      throw new Error('VidKing service is not enabled');
    }

    return this.buildEmbedUrl(tmdbId, type, season, episode);
  }

  /**
   * Search for content on VidKing
   * @param {string} query - Search query
   * @param {string} type - Content type: 'movie', 'tv', or 'all'
   * @param {number} page - Page number for pagination
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Search results with pagination info
   */
  async search(query, type = 'movie', page = 1, limit = 20) {
    if (!this.enabled) {
      throw new Error('VidKing service is not enabled');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: query,
          type: type,
          page: page,
          limit: limit,
          api_key: this.apiKey
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        results: response.data.results || [],
        pagination: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        }
      };
    } catch (error) {
      console.error('VidKing search error:', error.message);
      
      if (error.response) {
        throw new Error(`VidKing API error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('VidKing API is not responding');
      } else {
        throw error;
      }
    }
  }

  /**
   * Check VidKing API status and availability
   * @returns {Promise<Object>} Status information
   */
  async checkStatus() {
    if (!this.enabled) {
      return {
        available: false,
        enabled: false,
        message: 'VidKing service is not enabled'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/status`, {
        params: { api_key: this.apiKey },
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });

      return {
        available: response.data.status === 'online' || response.status === 200,
        enabled: this.enabled,
        message: response.data.message || 'VidKing API is operational',
        rateLimit: response.data.rate_limit || null,
        version: response.data.version || 'v1',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('VidKing status check error:', error.message);
      
      return {
        available: false,
        enabled: this.enabled,
        message: error.message || 'VidKing API is not responding',
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed information about available sources for content
   * @param {string} tmdbId - TMDb ID
   * @param {string} type - Content type
   * @returns {Promise<Object>} Detailed source information
   */
  async getSourceInfo(tmdbId, type = 'movie') {
    if (!this.enabled) {
      throw new Error('VidKing service is not enabled');
    }

    try {
      const sources = await this.getSources(tmdbId, type);
      
      return {
        success: true,
        tmdbId,
        type,
        totalSources: sources.length,
        sources: sources,
        qualityBreakdown: this.getQualityBreakdown(sources),
        typeBreakdown: this.getTypeBreakdown(sources),
        hasSubtitles: sources.some(s => s.subtitles && s.subtitles.length > 0),
        bestSource: sources[0] || null
      };
    } catch (error) {
      console.error('VidKing getSourceInfo error:', error.message);
      throw error;
    }
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
   * Get type breakdown of sources
   * @param {Array} sources - Array of sources
   * @returns {Object} Type breakdown
   */
  getTypeBreakdown(sources) {
    const breakdown = {};
    sources.forEach(source => {
      const type = source.type || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Check if VidKing service is enabled
   * No API key needed - works with direct embeds!
   * @returns {boolean} True if service is ready to use
   */
  isEnabled() {
    return this.enabled;
  }
}

module.exports = new VidKingService();
