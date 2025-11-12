import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, SkipBack, SkipForward, Loader2, Wifi
} from 'lucide-react';

const ModernVideoControls = ({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  isFullscreen,
  isLoading,
  isBuffering,
  currentQuality,
  availableQualities,
  playbackSpeed,
  onPlayPause,
  onMuteToggle,
  onVolumeChange,
  onSeek,
  onFullscreen,
  onQualityChange,
  onSpeedChange,
  onSkipBackward,
  onSkipForward,
  showControls
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"
        >
          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="bg-black/80 backdrop-blur-sm rounded-full p-6">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
          )}

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isLoading && (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                )}
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>{currentQuality || 'Auto'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={onSeek}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer 
                           hover:h-2 transition-all duration-200
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-primary-500
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-all
                           [&::-webkit-slider-thumb]:hover:w-4
                           [&::-webkit-slider-thumb]:hover:h-4
                           [&::-moz-range-thumb]:w-3 
                           [&::-moz-range-thumb]:h-3 
                           [&::-moz-range-thumb]:rounded-full 
                           [&::-moz-range-thumb]:bg-primary-500
                           [&::-moz-range-thumb]:border-0
                           [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                
                {/* Time Tooltip on Hover */}
                <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="relative" style={{ left: `${progressPercent}%` }}>
                    <div className="absolute -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {formatTime(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-white/80 text-xs mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="bg-gradient-to-t from-black/90 to-transparent px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center space-x-3">
                  {/* Play/Pause */}
                  <button
                    onClick={onPlayPause}
                    className="text-white hover:text-primary-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                  </button>

                  {/* Skip Backward */}
                  <button
                    onClick={onSkipBackward}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <SkipBack size={20} />
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={onSkipForward}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <SkipForward size={20} />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2 group">
                    <button
                      onClick={onMuteToggle}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    
                    <div className="w-0 group-hover:w-20 overflow-hidden transition-all duration-300">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={onVolumeChange}
                        className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none 
                                 [&::-webkit-slider-thumb]:w-3 
                                 [&::-webkit-slider-thumb]:h-3 
                                 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-white
                                 [&::-webkit-slider-thumb]:cursor-pointer
                                 [&::-moz-range-thumb]:w-3 
                                 [&::-moz-range-thumb]:h-3 
                                 [&::-moz-range-thumb]:rounded-full 
                                 [&::-moz-range-thumb]:bg-white
                                 [&::-moz-range-thumb]:border-0"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-white/80 text-sm font-medium hidden md:block">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-2">
                  {/* Playback Speed */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-white/80 hover:text-white transition-colors px-3 py-2 hover:bg-white/10 rounded-lg text-sm font-medium"
                    >
                      {playbackSpeed}x
                    </button>
                    
                    <AnimatePresence>
                      {showSpeedMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl"
                        >
                          {speeds.map(speed => (
                            <button
                              key={speed}
                              onClick={() => {
                                onSpeedChange(speed);
                                setShowSpeedMenu(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                playbackSpeed === speed
                                  ? 'bg-primary-600 text-white'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {speed === 1 ? 'Normal' : `${speed}x`}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quality Selector */}
                  {availableQualities && availableQualities.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="text-white/80 hover:text-white transition-colors px-3 py-2 hover:bg-white/10 rounded-lg text-sm font-medium"
                      >
                        {currentQuality || 'Auto'}
                      </button>
                      
                      <AnimatePresence>
                        {showQualityMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl"
                          >
                            {availableQualities.map(quality => (
                              <button
                                key={quality}
                                onClick={() => {
                                  onQualityChange(quality);
                                  setShowQualityMenu(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                  currentQuality === quality
                                    ? 'bg-primary-600 text-white'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {quality}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Settings */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <Settings size={20} />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={onFullscreen}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModernVideoControls;
