# VidKing Integration - Quick Start

## ✅ Good News: No API Key Needed!

VidKing works with **direct embed URLs** - no API key required! It's already enabled and working.

## 🎬 How It Works

VidKing uses a simple URL pattern based on TMDb IDs:

```
https://www.vidking.net/embed/movie/{TMDB_ID}
https://www.vidking.net/embed/tv/{TMDB_ID}/{SEASON}/{EPISODE}
```

### Examples

**Movies:**
- Fight Club (TMDb: 550): `https://www.vidking.net/embed/movie/550`
- Your example (TMDb: 1078605): `https://www.vidking.net/embed/movie/1078605`

**TV Shows:**
- Breaking Bad S01E01: `https://www.vidking.net/embed/tv/1396/1/1`

## 🚀 Using VidKing in Your App

### 1. API Endpoint

Get VidKing embed URL for any movie:

```bash
curl "http://localhost:5000/api/streaming/vidking/{TMDB_ID}"
```

**Example:**
```bash
curl "http://localhost:5000/api/streaming/vidking/550"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "embedUrl": "https://www.vidking.net/embed/movie/550",
    "sources": [{
      "url": "https://www.vidking.net/embed/movie/550",
      "quality": "1080p",
      "type": "embed",
      "provider": "vidking",
      "priority": 90
    }],
    "provider": "vidking",
    "tmdbId": "550"
  }
}
```

### 2. Embed in HTML

```html
<iframe 
  src="https://www.vidking.net/embed/movie/550" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen>
</iframe>
```

### 3. Use in React Component

```javascript
import React from 'react';

function VidKingPlayer({ tmdbId }) {
  const embedUrl = `https://www.vidking.net/embed/movie/${tmdbId}`;
  
  return (
    <iframe
      src={embedUrl}
      width="100%"
      height="600"
      frameBorder="0"
      allowFullScreen
      title="Movie Player"
    />
  );
}

export default VidKingPlayer;
```

### 4. Use VidKing Service Directly

```javascript
const vidkingService = require('./server/services/vidkingService');

// Get embed URL
const embedUrl = await vidkingService.getEmbedUrl('550', 'movie');
console.log(embedUrl); // https://www.vidking.net/embed/movie/550

// Get sources
const sources = await vidkingService.getSources('550', 'movie');
console.log(sources); // Array of source objects
```

## 🔧 Configuration

VidKing is **enabled by default** in your `.env`:

```env
VIDKING_ENABLED=true
VIDKING_BASE_URL=https://www.vidking.net
```

To disable (if needed):
```env
VIDKING_ENABLED=false
```

## 🧪 Testing

### Test VidKing Service
```bash
node test-vidking-service.js
```

### Test API Endpoint
```bash
# Test with Fight Club
curl "http://localhost:5000/api/streaming/vidking/550"

# Test with your example
curl "http://localhost:5000/api/streaming/vidking/1078605"

# Test with TV show (Breaking Bad S01E01)
curl "http://localhost:5000/api/streaming/vidking/1396?type=tv&season=1&episode=1"
```

### Test in Browser

Open these URLs directly:
- http://localhost:5000/api/streaming/vidking/550
- http://localhost:5000/api/streaming/vidking/1078605

Or test the embed:
- https://www.vidking.net/embed/movie/550
- https://www.vidking.net/embed/movie/1078605

## 📊 Integration Status

✅ **VidKing Service** - Implemented and working
✅ **Direct Embed URLs** - No API key needed
✅ **API Endpoint** - `/api/streaming/vidking/:movieId`
✅ **Movie Support** - Working
✅ **TV Show Support** - Working (with season/episode)
✅ **Auto-enabled** - Ready to use out of the box

## 🎯 Next Steps

### Option 1: Use VidKing as Primary Provider

Update your video player to use VidKing first:

```javascript
// In your video player component
async function getStreamingUrl(tmdbId) {
  try {
    // Try VidKing first
    const response = await fetch(`/api/streaming/vidking/${tmdbId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.embedUrl;
    }
  } catch (error) {
    console.error('VidKing failed, trying fallback...');
  }
  
  // Fallback to other providers
  return getFallbackUrl(tmdbId);
}
```

### Option 2: Implement Task 5 (Enhanced Streaming Service)

Create a service that tries VidKing first, then falls back to other providers:

```javascript
// services/enhancedStreamingService.js
async function getMovieSources(tmdbId) {
  const sources = [];
  
  // Try VidKing first (highest priority)
  try {
    const vidkingSources = await vidkingService.getSources(tmdbId);
    sources.push(...vidkingSources);
  } catch (error) {
    console.log('VidKing unavailable, trying fallback...');
  }
  
  // Add fallback providers
  const fallbackSources = await streamingService.getMovieSources(tmdbId);
  sources.push(...fallbackSources);
  
  return sources;
}
```

## 💡 Tips

1. **No Rate Limits** - VidKing embeds don't require authentication
2. **High Priority** - VidKing sources have priority 90 (highest)
3. **Always Available** - Works without API keys or registration
4. **Multiple Qualities** - VidKing automatically handles quality selection
5. **Subtitles** - VidKing includes subtitle support

## 🐛 Troubleshooting

### VidKing Not Working?

1. **Check if enabled:**
   ```bash
   curl "http://localhost:5000/api/streaming/test" | jq '.data.vidking'
   ```

2. **Test embed directly:**
   Open https://www.vidking.net/embed/movie/550 in browser

3. **Check service status:**
   ```bash
   node -e "const v = require('./server/services/vidkingService'); console.log('Enabled:', v.isEnabled())"
   ```

### Embed Not Loading?

- Check browser console for CORS errors
- Ensure iframe has proper attributes (allowfullscreen, etc.)
- Try different TMDb IDs to verify the pattern

## 📝 Summary

**What You Have:**
- ✅ VidKing service fully implemented
- ✅ Working with direct embed URLs
- ✅ No API key needed
- ✅ API endpoint ready
- ✅ Enabled by default

**What You Can Do:**
- Use VidKing embeds in your video player
- Get streaming URLs via API
- Integrate with existing streaming service
- Build enhanced streaming with fallback (Task 5)

---

**VidKing is ready to use! No additional setup needed.** 🎉
