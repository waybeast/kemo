import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Play, Calendar, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMovie } from '../contexts/MovieContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const WatchHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const { getMovieById } = useMovie();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moviesData, setMoviesData] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadWatchHistory();
  }, [isAuthenticated, navigate]);

  const loadWatchHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const historyItems = response.data.data;
        setHistory(historyItems);

        // Fetch movie details for each history item
        const moviePromises = historyItems.map(item => 
          getMovieById(item.movieId).catch(() => null)
        );
        const movies = await Promise.all(moviePromises);
        
        const moviesMap = {};
        movies.forEach((movieResponse, index) => {
          if (movieResponse?.data) {
            moviesMap[historyItems[index].movieId] = movieResponse.data;
          }
        });
        setMoviesData(moviesMap);
      }
    } catch (error) {
      console.error('Error loading watch history:', error);
      toast.error('Failed to load watch history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWatching = (item) => {
    navigate(`/watch/${item.movieId}`);
  };

  const handleRemoveFromHistory = async (movieId) => {
    try {
      // Note: Backend doesn't have delete endpoint yet, so we'll just filter locally
      setHistory(prev => prev.filter(item => item.movieId !== movieId));
      toast.success('Removed from watch history');
    } catch (error) {
      console.error('Error removing from history:', error);
      toast.error('Failed to remove from history');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading watch history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Watch History</h1>
          <p className="text-gray-400">
            {history.length} movie{history.length !== 1 ? 's' : ''} in your history
          </p>
        </motion.div>

        {/* Empty State */}
        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Clock className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">No watch history yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start watching movies and they'll appear here so you can continue where you left off.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Movies
            </button>
          </motion.div>
        )}

        {/* History List */}
        {history.length > 0 && (
          <div className="space-y-4">
            {history.map((item, index) => {
              const movie = moviesData[item.movieId];
              if (!movie) return null;

              return (
                <motion.div
                  key={item.movieId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center p-4 gap-4">
                    {/* Movie Poster */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={movie.poster || '/placeholder-movie.jpg'}
                        alt={movie.title}
                        className="w-32 h-48 object-cover rounded-lg"
                        onError={(e) => e.target.src = '/placeholder-movie.jpg'}
                      />
                      {/* Progress Overlay */}
                      {item.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-primary-600 h-1.5 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <p className="text-white text-xs mt-1 text-center">
                            {Math.floor(item.progress)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-2 truncate">
                        {movie.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {movie.year}
                        </span>
                        {item.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(item.duration)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-4 h-4" />
                          Watched {formatDate(item.watchedAt)}
                        </span>
                      </div>

                      {/* Progress Info */}
                      {item.lastPosition > 0 && (
                        <div className="text-sm text-gray-300 mb-2">
                          Resume from {formatDuration(item.lastPosition)}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {movie.description || 'No description available.'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleContinueWatching(item)}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {item.progress > 90 ? 'Watch Again' : 'Continue'}
                      </button>
                      <button
                        onClick={() => handleRemoveFromHistory(item.movieId)}
                        className="px-6 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchHistory;
