const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const Movie = require('../models/Movie');

class TelegramService {
  constructor() {
    this.bot = null;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.apiToken = process.env.TELEGRAM_API_TOKEN;
    
    if (this.botToken) {
      this.bot = new TelegramBot(this.botToken, { polling: false });
    }
  }

  // Search for movie in Telegram channel
  async searchMovieInChannel(movieTitle, year = null) {
    try {
      if (!this.channelId || !this.apiToken) {
        throw new Error('Telegram configuration missing');
      }

      const searchQuery = year ? `${movieTitle} ${year}` : movieTitle;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Search in channel using Telegram API
      const searchUrl = `https://api.telegram.org/bot${this.apiToken}/getUpdates`;
      
      // Alternative: Search through channel messages
      const messages = await this.searchChannelMessages(searchQuery);
      
      if (messages.length > 0) {
        return messages.map(msg => ({
          messageId: msg.message_id,
          fileId: msg.document?.file_id || msg.video?.file_id,
          fileName: msg.document?.file_name || msg.caption,
          fileSize: msg.document?.file_size || msg.video?.file_size,
          date: msg.date
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Telegram search error:', error);
      return [];
    }
  }

  // Search through channel messages
  async searchChannelMessages(query, limit = 50) {
    try {
      if (!this.channelId || !this.apiToken) {
        return [];
      }

      const messages = [];
      let offset = 0;
      
      // Get recent messages from channel
      const getHistoryUrl = `https://api.telegram.org/bot${this.apiToken}/getHistory`;
      
      // Since getHistory is not available, we'll use a different approach
      // Search through recent messages by getting updates
      const updatesUrl = `https://api.telegram.org/bot${this.apiToken}/getUpdates`;
      
      const response = await axios.get(updatesUrl, {
        params: {
          offset: offset,
          limit: limit,
          timeout: 30
        }
      });

      if (response.data.ok && response.data.result) {
        const channelMessages = response.data.result
          .filter(update => update.channel_post && update.channel_post.chat.id.toString() === this.channelId)
          .map(update => update.channel_post)
          .filter(msg => {
            const text = (msg.text || msg.caption || '').toLowerCase();
            const queryLower = query.toLowerCase();
            return text.includes(queryLower) || 
                   (msg.document && msg.document.file_name && 
                    msg.document.file_name.toLowerCase().includes(queryLower));
          });

        return channelMessages;
      }

      return [];
    } catch (error) {
      console.error('Error searching channel messages:', error);
      return [];
    }
  }

  // Get streaming URL for a file
  async getStreamingUrl(fileId) {
    try {
      if (!this.apiToken || !fileId) {
        throw new Error('Missing API token or file ID');
      }

      // Get file info
      const fileInfoUrl = `https://api.telegram.org/bot${this.apiToken}/getFile`;
      const fileResponse = await axios.get(fileInfoUrl, {
        params: { file_id: fileId }
      });

      if (fileResponse.data.ok && fileResponse.data.result) {
        const file = fileResponse.data.result;
        const filePath = file.file_path;
        
        // Generate direct download URL
        const downloadUrl = `https://api.telegram.org/file/bot${this.apiToken}/${filePath}`;
        
        return {
          url: downloadUrl,
          fileSize: file.file_size,
          fileName: file.file_name || 'movie.mp4'
        };
      }

      throw new Error('Failed to get file info');
    } catch (error) {
      console.error('Error getting streaming URL:', error);
      throw error;
    }
  }

  // Find and add backup streaming URL for a movie
  async addBackupStreamingUrl(movieId) {
    try {
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw new Error('Movie not found');
      }

      // Search for movie in Telegram channel
      const searchResults = await this.searchMovieInChannel(movie.title, movie.year);
      
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0]; // Take the first match
        
        // Get streaming URL
        const streamingInfo = await this.getStreamingUrl(bestMatch.fileId);
        
        // Add to movie's streaming URLs
        const newStreamingUrl = {
          quality: '720p', // Default quality
          url: streamingInfo.url,
          source: 'telegram',
          isActive: true,
          addedAt: new Date()
        };

        movie.streamingUrls.push(newStreamingUrl);
        movie.telegramFileId = bestMatch.fileId;
        movie.telegramMessageId = bestMatch.messageId;
        
        await movie.save();
        
        return {
          success: true,
          streamingUrl: newStreamingUrl,
          message: 'Backup streaming URL added from Telegram'
        };
      }

      return {
        success: false,
        message: 'No matching movie found in Telegram channel'
      };
    } catch (error) {
      console.error('Error adding backup streaming URL:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Check if streaming URL is still valid
  async validateStreamingUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400
      });
      
      return {
        isValid: true,
        contentLength: response.headers['content-length'],
        contentType: response.headers['content-type']
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // Update movie with Telegram data
  async updateMovieWithTelegramData(movieId, telegramData) {
    try {
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw new Error('Movie not found');
      }

      movie.telegramFileId = telegramData.fileId;
      movie.telegramMessageId = telegramData.messageId;
      
      await movie.save();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating movie with Telegram data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get channel statistics
  async getChannelStats() {
    try {
      if (!this.channelId || !this.apiToken) {
        return null;
      }

      const getChatUrl = `https://api.telegram.org/bot${this.apiToken}/getChat`;
      const response = await axios.get(getChatUrl, {
        params: { chat_id: this.channelId }
      });

      if (response.data.ok) {
        return {
          title: response.data.result.title,
          memberCount: response.data.result.member_count,
          description: response.data.result.description
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting channel stats:', error);
      return null;
    }
  }

  // Test Telegram connection
  async testConnection() {
    try {
      if (!this.apiToken) {
        return { connected: false, error: 'No API token configured' };
      }

      const meUrl = `https://api.telegram.org/bot${this.apiToken}/getMe`;
      const response = await axios.get(meUrl);
      
      if (response.data.ok) {
        return {
          connected: true,
          botInfo: response.data.result
        };
      }

      return { connected: false, error: 'Invalid API token' };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new TelegramService(); 