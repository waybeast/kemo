import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const VideoPlayer = ({ 
  sources, 
  title, 
  movieId,
  onProgress, 
  onError, 
  initialTime = 0,
  onSourceChange 
}) => {
  const [currentSource, setCurrentSource] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [playerType, setPlayerType] = useState('iframe');
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Auto-select first available source
  useEffect(() => {
    if (sources && sources.length > 0 && !currentSource) {
      const bestSource = selectBestSource(sources);
      setCurrentSource(bestSource);
      setPlayerType(determinePlayerType(bestSource.url));
    }
  }, [sources, currentSource]);

  // Handle source change
  useEffect(() => {
    if (currentSource && onSourceChange) {
      onSourceChange(currentSource);
    }
  }, [currentSource, onSourceChange]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // Progress tracking with 10-second intervals
  useEffect(() => {
    if (isPlaying && movieId && currentTime > 0 && duration > 0) {
      // Start progress tracking interval
      progressIntervalRef.current = setInterval(() => {
        sendProgressUpdate();
      }, 10000); // 10 seconds

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [isPlaying, movieId, currentTime, duration]);

  // Send final progress update when component unmounts
  useEffect(() => {
    return () => {
      if (movieId && currentTime > 0) {
        sendProgressUpdate();
      }
    };
  }, []);

  // Resume from initial time
  useEffect(() => {
    if (videoRef.current && initialTime > 0 && duration > 0) {
      videoRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
      toast.success(`Resuming from ${formatTime(initialTime)}`);
    }
  }, [initialTime, duration]);

  const selectBestSource = (sources) => {
    // Priority: direct > embed > iframe
    const directSources = sources.filter(s => s.type === 'direct');
    const embedSources = sources.filter(s => s.type === 'embed');
    const iframeSources = sources.filter(s => s.type === 'iframe');

    // Prefer 1080p > 720p > 480p
    const sortByQuality = (sources) => {
      return sources.sort((a, b) => {
        const qualityOrder = { '1080p': 3, '720p': 2, '480p': 1, '360p': 0 };
        return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
      });
    };

    if (directSources.length > 0) {
      return sortByQuality(directSources)[0];
    } else if (embedSources.length > 0) {
      return sortByQuality(embedSources)[0];
    } else if (iframeSources.length > 0) {
      return sortByQuality(iframeSources)[0];
    }
    
    return sources[0];
  };

  const determinePlayerType = (url) => {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) return 'video';
    return 'iframe';
  };

  const handlePlayPause = () => {
    if (playerType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const sendProgressUpdate = async () => {
    if (!movieId || currentTime === 0 || duration === 0) return;

    // Avoid sending duplicate updates
    if (Math.abs(currentTime - lastProgressUpdate) < 5) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if not authenticated

      const progressPercent = (currentTime / duration) * 100;

      const response = await fetch(`/api/streaming/progress/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentTime,
          duration,
          progress: progressPercent
        })
      });

      if (response.ok) {
        setLastProgressUpdate(currentTime);
        console.log(`Progress updated: ${Math.floor(progressPercent)}%`);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Don't show error toast to avoid interrupting playback
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      const newDuration = videoRef.current.duration;
      
      setCurrentTime(newTime);
      setDuration(newDuration);
      
      if (onProgress) {
        onProgress({
          currentTime: newTime,
          duration: newDuration,
          progress: (newTime / newDuration) * 100
        });
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSourceSelect = (source) => {
    setCurrentSource(source);
    setPlayerType(determinePlayerType(source.url));
    setError(null);
    setIsLoading(true);
    setShowSourceSelector(false);
    
    toast.success(`Switched to ${source.provider} (${source.quality})`);
  };

  const handleError = (error) => {
    console.error('Video player error:', error);
    setError('Failed to load video source');
    setIsLoading(false);
    
    if (onError) {
      onError(error);
    }
    
    toast.error('Video source failed to load. Try another source.');
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const renderVideoPlayer = () => {
    if (!currentSource) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <div className="text-center text-white">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">No Video Source Available</h3>
            <p className="text-gray-400">Please select a streaming source to continue</p>
          </div>
        </div>
      );
    }

    switch (playerType) {
      case 'video':
        return (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            muted={isMuted}
            volume={volume}
            controls={false}
            preload="metadata"
          >
            <source src={currentSource.url} type="video/mp4" />
            <source src={currentSource.url} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        );
      
      case 'hls':
        return (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            muted={isMuted}
            volume={volume}
            controls={false}
            preload="metadata"
          >
            <source src={currentSource.url} type="application/x-mpegURL" />
            Your browser does not support HLS video.
          </video>
        );
      
      case 'iframe':
      default:
        return (
          <iframe
            src={currentSource.url}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={title}
            onLoad={handleCanPlay}
            onError={handleError}
          />
        );
    }
  };

  const renderSourceSelector = () => {
    if (!sources || sources.length === 0) return null;

    return (
      <AnimatePresence>
        {showSourceSelector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-sm z-50"
          >
            <h3 className="text-white font-semibold mb-3">Select Source</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => handleSourceSelect(source)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSource?.url === source.url
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{source.provider}</div>
                      <div className="text-sm opacity-75">
                        {source.quality} • {source.type}
                      </div>
                    </div>
                    {currentSource?.url === source.url && (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Player */}
      <div className="relative w-full h-full">
        {renderVideoPlayer()}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Video Error</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => setShowSourceSelector(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Try Another Source
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-white text-sm mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="text-white text-sm">
                  {currentSource?.provider} • {currentSource?.quality}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSourceSelector(!showSourceSelector)}
                  className="text-white hover:text-blue-400 transition-colors p-2"
                  title="Change Source"
                >
                  <Settings size={20} />
                </button>
                
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-blue-400 transition-colors p-2"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source Selector */}
      {renderSourceSelector()}

      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-white font-semibold truncate">{title}</h1>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {playerType.toUpperCase()} Player
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer; 