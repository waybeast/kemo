import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovie } from '../../contexts/MovieContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ContinueWatching = () => {
  const { isAuthenticated } = useAuth();
  const { getMovieById } = useMovie();
  const navigate = useNavigate();
  const [continueWatchingItems, setContinueWatchingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadContinueWatching();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadContinueWatching = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Filter items with progress < 90% (not fully watched)
        const inProgress = response.data.data
          .filter(item => item.progress > 5 && item.progress < 90)
          .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
          .slice(0, 6); // Show max 6 items

        // Fetch movie details
        const moviePromises = inProgress.map(item =>
          getMovieById(item.movieId).catch(() => null)
        );
        const movies = await Promise.all(moviePromises);

        const items = inProgress.map((item, index) => ({
          ...item,
          movie: movies[index]?.data
        })).filter(item => item.movie);

        setContinueWatchingItems(items);
      }
    } catch (error) {
      console.error('Error loading continue watching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = (item) => {
    navigate(`/watch/${item.movieId}`);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated || isLoading || continueWatchingItems.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-primary-500" />
          Continue Watching
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {continueWatchingItems.map((item, index) => (
          <motion.div
            key={item.movieId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => handleContinue(item)}
          >
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={item.movie.poster || '/placeholder-movie.jpg'}
                alt={item.movie.title}
                className="w-full h-72 object-cover transition-transform group-hover:scale-105"
                onError={(e) => e.target.src = '/placeholder-movie.jpg'}
              />
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white">
                  <span>{formatDuration(item.lastPosition)}</span>
                  <span>{formatDuration(item.duration)}</span>
                </div>
              </div>

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </motion.div>
              </div>
            </div>

            {/* Movie Title */}
            <div className="mt-2">
              <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-primary-400 transition-colors">
                {item.movie.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {Math.floor(item.progress)}% watched
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ContinueWatching;
