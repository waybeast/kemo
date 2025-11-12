import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Share2, Download, ArrowLeft, Clock, Star, Calendar,
  RotateCcw, Settings, Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMovie } from '../contexts/MovieContext';
import MovieCard from '../components/movies/MovieCard';
import VideoPlayer from '../components/video/VideoPlayer';
import SourceManager from '../components/video/SourceManager';
import { toast } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

const MoviePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, addToWatchlist, removeFromWatchlist, addToHistory } = useAuth();
  const { getMovieById, trackPageView } = useMovie();

  const [movie, setMovie] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingSources, setStreamingSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [watchProgress, setWatchProgress] = useState(null);
  const [showSourceManager, setShowSourceManager] = useState(true); // Auto-show source manager

  const loadMovie = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getMovieById(id);
      setMovie(response.data); // Extract data from response
      
      // Load watch progress if authenticated
      if (isAuthenticated) {
        await loadWatchProgress();
      }
      
      // Load related movies
      // For now, we'll use a simple approach
      setRelatedMovies([]);
    } catch (error) {
      console.error('Error loading movie:', error);
      toast.error('Failed to load movie');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated]); // Removed getMovieById to prevent infinite loop

  const loadWatchProgress = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/streaming/progress/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setWatchProgress({
          lastPosition: data.data.currentPosition || 0,
          progress: data.data.progress || 0,
          duration: data.data.duration || 0
        });
      }
    } catch (error) {
      console.error('Error loading watch progress:', error);
    }
  };

  useEffect(() => {
    // Disable analytics to prevent infinite loops
    // if (isAuthenticated) {
    //   trackPageView({
    //     page: 'movie-player',
    //     movieId: id,
    //     userId: 'authenticated'
    //   });
    // }
    loadMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only reload when movie ID changes

  const handleProgressUpdate = async (progress) => {
    if (!isAuthenticated) return;
    
    try {
      await addToHistory({
        movieId: id,
        progress: progress.progress,
        duration: progress.duration,
        lastPosition: progress.currentTime
      });
    } catch (error) {
      console.error('Error updating watch progress:', error);
    }
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setShowSourceManager(false);
  };

  const handleSourcesLoaded = (sources) => {
    console.log('📥 MoviePlayer: Received sources', sources.length, sources);
    setStreamingSources(sources);
    if (sources.length > 0) {
      console.log('🎯 MoviePlayer: Setting selected source', sources[0]);
      setSelectedSource(sources[0]);
    }
  };

  const handleWatchlistToggle = async () => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(id);
        setIsInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await addToWatchlist(id);
        setIsInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie?.title,
        text: `Watch ${movie?.title} on Kemo`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    toast.info('Download feature coming soon!');
  };

  const handleError = (error) => {
    console.error('Video player error:', error);
    toast.error('Video playback error. Try another source.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading movie...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSourceManager(!showSourceManager)}
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
              title="Change Source"
            >
              <Settings size={20} />
              <span className="hidden md:inline">Sources</span>
            </button>
            
            <button
              onClick={handleWatchlistToggle}
              className={`flex items-center space-x-2 transition-colors ${
                isInWatchlist 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-white hover:text-red-400'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Heart size={20} fill={isInWatchlist ? 'currentColor' : 'none'} />
              <span className="hidden md:inline">Watchlist</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
              title="Share"
            >
              <Share2 size={20} />
              <span className="hidden md:inline">Share</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
              title="Download"
            >
              <Download size={20} />
              <span className="hidden md:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Video Player Section */}
        <div className="flex-1 relative">
          {selectedSource ? (
            <VideoPlayer
              sources={streamingSources}
              title={movie.title}
              movieId={id}
              onProgress={handleProgressUpdate}
              onError={handleError}
              initialTime={watchProgress?.lastPosition || 0}
              onSourceChange={setSelectedSource}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎬</div>
                <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
                <p className="text-gray-400 mb-4">Select a streaming source to start watching</p>
                
                <button
                  onClick={() => setShowSourceManager(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <Play size={20} />
                  <span>Choose Source</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Source Manager Sidebar */}
        <AnimatePresence>
          {showSourceManager && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-950 border-l border-gray-800 overflow-hidden"
            >
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-lg">Streaming Sources</h2>
                  <button
                    onClick={() => setShowSourceManager(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                
                <SourceManager
                  movieId={id}
                  movieTitle={movie.title}
                  onSourcesLoaded={handleSourcesLoaded}
                  onSourceSelect={handleSourceSelect}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movie Info Overlay - Hide when source manager is open or when video is selected */}
      <AnimatePresence>
        {!showSourceManager && !selectedSource && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 z-40"
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* Movie Poster */}
                <img
                  src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : '/placeholder-movie.jpg'}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-movie.jpg';
                  }}
                />
                
                {/* Movie Info */}
                <div className="flex-1">
                  <h1 className="text-white font-bold text-xl mb-1">{movie.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-300 text-sm mb-2">
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{movie.voteAverage?.toFixed(1) || 'N/A'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{movie.releaseDate?.split('-')[0] || 'N/A'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{movie.runtime || 'N/A'} min</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {movie.overview || 'No description available.'}
                  </p>
                  
                  {/* Watch Progress */}
                  {watchProgress && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 text-blue-400 text-sm">
                        <RotateCcw className="w-4 h-4" />
                        <span>Resume from {Math.floor(watchProgress.lastPosition / 60)}:{(watchProgress.lastPosition % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setShowSourceManager(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center space-x-2"
                  >
                    <Settings size={16} />
                    <span>Sources</span>
                  </button>
                  
                  <button
                    onClick={handleWatchlistToggle}
                    className={`px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                      isInWatchlist 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    <Heart size={16} fill={isInWatchlist ? 'currentColor' : 'none'} />
                    <span>{isInWatchlist ? 'Remove' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <div className="bg-gray-950 p-6">
          <h2 className="text-white font-semibold text-xl mb-4">Related Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedMovies.map((relatedMovie) => (
              <MovieCard key={relatedMovie.id} movie={relatedMovie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer; 