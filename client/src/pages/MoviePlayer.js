import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Share2, ArrowLeft, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMovie } from '../contexts/MovieContext';
import MovieCard from '../components/movies/MovieCard';
import VideoPlayer from '../components/video/VideoPlayer';
import SourceManager from '../components/video/SourceManager';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../utils/api';

const MoviePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, addToWatchlist, removeFromWatchlist, addToHistory } = useAuth();
  const { getMovieById } = useMovie();

  const [movie, setMovie] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingSources, setStreamingSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [watchProgress, setWatchProgress] = useState(null);
  const [showSourceManager, setShowSourceManager] = useState(false); // Hidden by default - auto-play VidKing
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState(false);
  const [videoPlaybackStarted, setVideoPlaybackStarted] = useState(false);

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
      const response = await fetch(getApiUrl(`/api/streaming/progress/${id}`), {
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
    loadMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only reload when movie ID changes

  // Listen for VidKing playback events to detect if video actually plays
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes('vidking.net')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'PLAYER_EVENT' && data.data) {
          const { event: eventType } = data.data;
          
          // Detect if video actually started playing
          if (eventType === 'play' || eventType === 'timeupdate') {
            setVideoPlaybackStarted(true);
            setSourcesError(false);
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    setSourcesLoading(false);
    setStreamingSources(sources);
    
    if (sources.length > 0) {
      console.log('🎯 MoviePlayer: Auto-playing first source', sources[0]);
      setSelectedSource(sources[0]);
      setSourcesError(false);
      // Auto-hide source manager since we're auto-playing
      setShowSourceManager(false);
    } else {
      // No sources available
      setSourcesError(true);
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
            {/* Only show Sources button when multiple sources are available */}
            {streamingSources.length > 1 && (
              <button
                onClick={() => setShowSourceManager(!showSourceManager)}
                className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
                title="Change Source"
              >
                <Settings size={20} />
                <span className="hidden md:inline">Sources</span>
              </button>
            )}
            
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
          </div>
        </div>
      </div>

      {/* Hidden SourceManager - loads sources in background */}
      <div style={{ display: 'none' }}>
        <SourceManager
          movieId={id}
          movieTitle={movie.title}
          onSourcesLoaded={handleSourcesLoaded}
          onSourceSelect={handleSourceSelect}
        />
      </div>

      {/* Main Content */}
      <div className="h-screen">
        {/* Video Player Section - Full Screen */}
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
        ) : sourcesError ? (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-8">
            <div className="text-center text-white max-w-md">
              <div className="text-6xl mb-6">😔</div>
              <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2 text-red-400">Not Available for Streaming</h2>
                <p className="text-gray-300 mb-4">
                  This movie is not currently available on our streaming providers. 
                  We're constantly adding new content!
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/browse')}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Browse Available Movies
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Go Back
                </button>
              </div>
              
              <p className="text-gray-500 text-sm mt-6">
                Tip: Try popular movies like The Godfather, Inception, or The Dark Knight
              </p>
            </div>
          </div>
        ) : sourcesLoading ? (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎬</div>
              <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
              <p className="text-gray-400 mb-4">Finding streaming sources...</p>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-4">This may take a few seconds</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎬</div>
              <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
              <p className="text-gray-400 mb-4">Preparing video player...</p>
            </div>
          </div>
        )}

        {/* Source Manager Sidebar - Only show when multiple sources available */}
        <AnimatePresence>
          {showSourceManager && streamingSources.length > 1 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="fixed right-0 top-0 h-screen bg-gray-950 border-l border-gray-800 overflow-hidden z-50"
            >
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-lg">Streaming Sources</h2>
                  <button
                    onClick={() => setShowSourceManager(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-2">
                  {streamingSources.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => handleSourceSelect(source)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSource?.url === source.url
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium capitalize">{source.provider}</div>
                      <div className="text-sm opacity-75">
                        {source.quality} • {source.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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