# VidKing API Service Documentation

## Overview

The VidKing API Service provides a unified interface for accessing multiple streaming sources through the VidKing API. This service is designed as the primary streaming provider with built-in fallback mechanisms.

## Features

- **Multiple Source Types**: Supports HLS, DASH, direct links, and embed URLs
- **Quality Selection**: Automatic prioritization of sources by quality (2160p, 1440p, 1080p, 720p, 480p, 360p)
- **Smart Prioritization**: Sources are ranked by type, quality, and availability
- **Subtitle Support**: Handles subtitle tracks when available
- **Search Functionality**: Search for movies and TV shows
- **Status Monitoring**: Check API availability and rate limits
- **Error Handling**: Comprehensive error handling with detailed messages

## Configuration

Add the following environment variables to your `.env` file:

```bash
# VidKing API Configuration
VIDKING_API_KEY=your_vidking_api_key_here
VIDKING_BASE_URL=https://vidking.net/api/v1
VIDKING_ENABLED=true
VIDKING_TIMEOUT=10000
```

### Configuration Options

- `VIDKING_API_KEY`: Your VidKing API key (required)
- `VIDKING_BASE_URL`: Base URL for the VidKing API (default: https://vidking.net/api/v1)
- `VIDKING_ENABLED`: Enable/disable the service (default: false)
- `VIDKING_TIMEOUT`: Request timeout in milliseconds (default: 10000)

## Usage

### Import the Service

```javascript
const vidkingService = require('./server/services/vidkingService');
```

### Check if Service is Enabled

```javascript
if (vidkingService.isEnabled()) {
  console.log('VidKing service is ready');
}
```

### Get Streaming Sources

```javascript
// For movies
const sources = await vidkingService.getSources('550', 'movie');

// For TV shows
const sources = await vidkingService.getSources('1399', 'tv', 1, 1); // Season 1, Episode 1
```

### Get Embed URL

```javascript
// For movies
const embedUrl = await vidkingService.getEmbedUrl('550', 'movie');

// For TV shows
const embedUrl = await vidkingService.getEmbedUrl('1399', 'tv', 1, 1);
```

### Search for Content

```javascript
const results = await vidkingService.search('Inception', 'movie', 1, 20);
console.log(results.results); // Array of search results
console.log(results.pagination); // Pagination info
```

### Check API Status

```javascript
const status = await vidkingService.checkStatus();
console.log(status.available); // true/false
console.log(status.message); // Status message
console.log(status.rateLimit); // Rate limit info
```

### Get Detailed Source Information

```javascript
const info = await vidkingService.getSourceInfo('550', 'movie');
console.log(info.totalSources); // Number of sources
console.log(info.qualityBreakdown); // Sources by quality
console.log(info.typeBreakdown); // Sources by type
console.log(info.bestSource); // Highest priority source
```

## API Methods

### `getSources(tmdbId, type, season, episode)`

Get streaming sources for content.

**Parameters:**
- `tmdbId` (string): TMDb ID of the content
- `type` (string): 'movie' or 'tv' (default: 'movie')
- `season` (number): Season number for TV shows (optional)
- `episode` (number): Episode number for TV shows (optional)

**Returns:** Array of source objects

**Source Object Structure:**
```javascript
{
  url: 'https://...',
  quality: '1080p',
  type: 'hls',
  language: 'en',
  provider: 'vidking',
  subtitles: [],
  isWorking: true,
  priority: 80,
  metadata: {
    server: 'server1',
    lastChecked: '2024-01-01T00:00:00.000Z'
  }
}
```

### `getEmbedUrl(tmdbId, type, season, episode)`

Get embed URL for content.

**Parameters:**
- `tmdbId` (string): TMDb ID of the content
- `type` (string): 'movie' or 'tv' (default: 'movie')
- `season` (number): Season number for TV shows (optional)
- `episode` (number): Episode number for TV shows (optional)

**Returns:** String (embed URL)

### `search(query, type, page, limit)`

Search for content.

**Parameters:**
- `query` (string): Search query
- `type` (string): 'movie', 'tv', or 'all' (default: 'movie')
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Returns:** Object with results and pagination info

### `checkStatus()`

Check API status and availability.

**Returns:** Object with status information

### `getSourceInfo(tmdbId, type)`

Get detailed information about available sources.

**Parameters:**
- `tmdbId` (string): TMDb ID
- `type` (string): 'movie' or 'tv' (default: 'movie')

**Returns:** Object with detailed source information

### `isEnabled()`

Check if service is enabled and configured.

**Returns:** Boolean

## Source Prioritization

Sources are automatically prioritized based on:

1. **Type Priority** (highest to lowest):
   - HLS: 40 points
   - DASH: 35 points
   - Direct: 30 points
   - Embed: 20 points
   - iFrame: 10 points

2. **Quality Priority**:
   - 2160p: 50 points
   - 1440p: 45 points
   - 1080p: 40 points
   - 720p: 30 points
   - 480p: 20 points
   - 360p: 10 points
   - 240p: 5 points

3. **Bonus Points**:
   - Active status: +10 points
   - Has subtitles: +5 points

The highest priority source is returned first in the array.

## Error Handling

The service provides detailed error messages:

```javascript
try {
  const sources = await vidkingService.getSources('550', 'movie');
} catch (error) {
  if (error.message.includes('not enabled')) {
    // Service is not configured
  } else if (error.message.includes('not responding')) {
    // API is down
  } else if (error.message.includes('API error')) {
    // API returned an error
  }
}
```

## Testing

Run the test script to verify the service:

```bash
node test-vidking-service.js
```

The test script will:
1. Check if the service is enabled
2. Verify API status
3. Test getting sources for a movie
4. Test getting embed URLs
5. Test search functionality
6. Test detailed source information

## Integration with Enhanced Streaming Service

The VidKing service is designed to work with the Enhanced Streaming Service, which provides:
- Automatic fallback to other providers
- Caching of streaming sources
- Graceful degradation

See `enhancedStreamingService.js` for integration details.

## Requirements

This service fulfills the following requirements from the scalable streaming architecture:

- **Requirement 2.1**: Adaptive bitrate streaming with multiple quality variants
- **Requirement 2.5**: HLS/DASH protocol support for adaptive streaming

## Notes

- The service is disabled by default for safety
- Always check `isEnabled()` before making API calls
- Sources are cached by the Enhanced Streaming Service to reduce API calls
- The service includes a 10-second timeout by default
- All API calls include proper User-Agent headers

## Support

For VidKing API documentation and support, visit: https://www.vidking.net/api/docs
