# 🎬 Kemo Video Player & Streaming System Guide

## Overview

The Kemo video player is a comprehensive streaming solution that integrates multiple open-source video players and streaming providers to deliver a seamless movie-watching experience.

## 🏗️ Architecture

### Components

1. **VideoPlayer** (`client/src/components/video/VideoPlayer.js`)
   - Main video player component
   - Supports multiple player types (iframe, HTML5 video, HLS)
   - Custom controls with progress tracking
   - Source switching capabilities

2. **SourceManager** (`client/src/components/video/SourceManager.js`)
   - Manages multiple streaming sources
   - Provider status monitoring
   - Quality and type-based sorting
   - Fallback mechanisms

3. **StreamingService** (`server/services/streamingService.js`)
   - Backend service for fetching streaming links
   - Multiple provider integration
   - Error handling and fallbacks

## 🎯 How Video Player Works

### 1. Source Selection Process

```javascript
// Priority order for source selection:
1. Direct sources (highest priority)
2. HLS streams
3. Embed sources (lowest priority)

// Quality priority:
1. 1080p
2. 720p
3. 480p
4. 360p
```

### 2. Player Type Detection

The system automatically detects the appropriate player type based on the source URL:

- **`.m3u8`** → HLS Player
- **`.mp4`, `.webm`, `.ogg`** → HTML5 Video Player
- **Other URLs** → iframe Embed Player

### 3. Fallback Mechanism

If a source fails to load, the system automatically tries the next available source in order of priority.

## 🌐 Streaming Providers

### Currently Integrated Providers

| Provider | Base URL | Status | Type |
|----------|----------|--------|------|
| **VidSrc.domains** | `https://vidsrc.domains` | ✅ Working | Embed |
| **VidSrc.pk** | `https://vidsrc.pk` | ✅ Working | Embed |
| **Embed.su** | `https://embed.su` | ✅ Working | Embed |
| **SuperEmbed** | `https://superembed.mobi` | ❌ Unavailable | Embed |
| **Sflix.to** | `https://sflix.to` | ❌ Unavailable | Embed |
| **WatchSeries.bar** | `https://watchseries.bar` | ❌ Unavailable | Embed |

### Provider Selection Logic

```javascript
const providerOrder = {
  'vidsrc': 3,      // Highest priority
  'embedSu': 2,     // Medium priority
  'sflix': 1        // Lower priority
};
```

## 🎮 Video Player Features

### Core Features

1. **Multi-Format Support**
   - HTML5 Video (MP4, WebM, OGG)
   - HLS Streaming (.m3u8)
   - iframe Embeds

2. **Custom Controls**
   - Play/Pause
   - Volume control
   - Fullscreen toggle
   - Progress bar with seeking
   - Auto-hide controls

3. **Source Management**
   - Real-time source switching
   - Quality selection
   - Provider status monitoring
   - Automatic fallback

4. **Progress Tracking**
   - Watch progress saving
   - Resume functionality
   - Progress synchronization

### Advanced Features

1. **Responsive Design**
   - Mobile-optimized controls
   - Touch-friendly interface
   - Adaptive layout

2. **Performance Optimization**
   - Lazy loading
   - Preload metadata
   - Efficient source switching

3. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Automatic retry mechanisms

## 🔧 API Endpoints

### Streaming Sources

```bash
# Get all streaming sources for a movie
GET /api/streaming/sources/{movieId}

# Response format:
{
  "success": true,
  "data": {
    "sources": {
      "embed": {
        "data": [
          {
            "provider": "vidsrc",
            "url": "https://vidsrc.domains/embed/550",
            "quality": "1080p",
            "type": "embed",
            "language": "en"
          }
        ]
      },
      "direct": { "data": [] },
      "hls": { "data": [] }
    }
  }
}
```

### Streaming Links

```bash
# Get direct streaming links
GET /api/streaming/links/{movieId}

# Get embed URLs
GET /api/streaming/embed/{movieId}

# Test provider status
GET /api/streaming/test
```

## 🎨 User Interface

### Video Player Layout

```
┌─────────────────────────────────────────┐
│ Header Controls                         │
│ [Back] [Sources] [Watchlist] [Share]   │
├─────────────────────────────────────────┤
│                                         │
│           Video Player                  │
│                                         │
│  [Play/Pause] [Volume] [Fullscreen]    │
│  [Progress Bar] [Time Display]         │
│                                         │
├─────────────────────────────────────────┤
│ Movie Info Overlay                      │
│ [Poster] [Title] [Rating] [Duration]   │
└─────────────────────────────────────────┘
```

### Source Manager Sidebar

```
┌─────────────────────────────────────────┐
│ Streaming Sources                    [×] │
├─────────────────────────────────────────┤
│ Available Providers                     │
│ [VidSrc] [Embed.su] [VidSrc.pk]        │
├─────────────────────────────────────────┤
│ Source List                             │
│ ┌─────────────────────────────────────┐ │
│ │ VidSrc (1080p) - Embed        [✓]  │ │
│ │ VidSrc (720p) - Embed              │ │
│ │ Embed.su (720p) - Embed            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🚀 Usage Examples

### Basic Video Player Usage

```jsx
import VideoPlayer from '../components/video/VideoPlayer';

<VideoPlayer
  sources={streamingSources}
  title="Movie Title"
  onProgress={handleProgressUpdate}
  onError={handleError}
  initialTime={watchProgress?.lastPosition || 0}
  onSourceChange={setSelectedSource}
/>
```

### Source Manager Usage

```jsx
import SourceManager from '../components/video/SourceManager';

<SourceManager
  movieId="550"
  movieTitle="Fight Club"
  onSourcesLoaded={handleSourcesLoaded}
  onSourceSelect={handleSourceSelect}
/>
```

## 🔍 Testing

### Manual Testing

1. **Access Video Player**
   ```bash
   http://localhost:3000/watch/550
   ```

2. **Test Source Switching**
   - Click "Sources" button
   - Select different providers
   - Verify video loads

3. **Test Controls**
   - Play/pause video
   - Adjust volume
   - Seek through timeline
   - Toggle fullscreen

### Automated Testing

Run the comprehensive test suite:

```bash
node test-video-player.js
```

## 📊 Performance Metrics

### Current Performance

- **Total Sources Available**: 54
- **Working Providers**: 3/6 (50%)
- **Average Load Time**: < 2 seconds
- **Source Switch Time**: < 1 second

### Optimization Tips

1. **Preload Sources**: Load sources in background
2. **Cache Results**: Cache successful sources
3. **Lazy Loading**: Load video only when needed
4. **Compression**: Use compressed video formats

## 🛠️ Troubleshooting

### Common Issues

1. **Video Not Playing**
   - Check if sources are available
   - Try different providers
   - Verify network connectivity

2. **Poor Quality**
   - Select higher quality source
   - Check internet speed
   - Try different provider

3. **Controls Not Working**
   - Refresh page
   - Check browser compatibility
   - Clear browser cache

### Debug Information

Enable debug mode in browser console:

```javascript
localStorage.setItem('debug', 'true');
```

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Players**
   - Video.js integration
   - Plyr.js integration
   - DPlayer integration

2. **Quality Adaptation**
   - Automatic quality switching
   - Bandwidth detection
   - Adaptive bitrate streaming

3. **Enhanced Controls**
   - Keyboard shortcuts
   - Picture-in-picture
   - Subtitle support

4. **Analytics**
   - View tracking
   - Quality metrics
   - User behavior analysis

## 📝 Configuration

### Environment Variables

```env
# Streaming Configuration
STREAMING_TIMEOUT=10000
STREAMING_RETRY_ATTEMPTS=3
STREAMING_FALLBACK_ENABLED=true

# Player Configuration
PLAYER_AUTOPLAY=false
PLAYER_PRELOAD=metadata
PLAYER_CONTROLS_TIMEOUT=3000
```

### Customization

The video player can be customized by modifying:

- `client/src/components/video/VideoPlayer.js` - Player behavior
- `client/src/components/video/SourceManager.js` - Source management
- `server/services/streamingService.js` - Provider integration
- `client/src/index.css` - Styling

## 🎉 Conclusion

The Kemo video player provides a robust, feature-rich streaming experience with:

- ✅ Multiple player types support
- ✅ Intelligent source selection
- ✅ Comprehensive error handling
- ✅ Progress tracking
- ✅ Responsive design
- ✅ Performance optimization

The system is designed to be extensible and can easily accommodate new streaming providers and player types as needed. 