import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Heart, Star, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MovieCard = ({ movie }) => {
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated, addToWatchlist, removeFromWatchlist } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false); // This would be determined by user's watchlist
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
  };

  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    if (isInWatchlist) {
      removeFromWatchlist(movie.id || movie._id);
      setIsInWatchlist(false);
    } else {
      addToWatchlist(movie.id || movie._id);
      setIsInWatchlist(true);
    }
  };

  const handleWatchMovie = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${movie.id || movie._id}`);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="movie-card group w-48"
    >
      <Link to={`/movie/${movie.id || movie._id}`} className="block">
        {/* Movie Poster */}
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={imageError ? '/placeholder-movie.jpg' : movie.poster}
            alt={movie.title}
            className="movie-poster"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Overlay with play button */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={handleWatchMovie}
            >
              <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
            </motion.div>
          </div>

          {/* Watchlist button */}
          <button
            onClick={handleWatchlistToggle}
            className="absolute top-2 right-2 w-8 h-8 bg-dark-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary-600"
          >
            <Heart
              className={`w-4 h-4 ${
                isInWatchlist ? 'text-red-500 fill-current' : 'text-white'
              }`}
            />
          </button>

          {/* Rating badge */}
          {movie.rating > 0 && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-dark-900 px-2 py-1 rounded text-xs font-bold flex items-center">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {movie.rating.toFixed(1)}
            </div>
          )}

          {/* Duration badge */}
          {movie.duration > 0 && (
            <div className="absolute bottom-2 left-2 bg-dark-800/80 text-white px-2 py-1 rounded text-xs flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(movie.duration)}
            </div>
          )}
        </div>

        {/* Movie Info */}
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-primary-400 transition-colors">
            {movie.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-dark-400">
            <span>{movie.year}</span>
            {movie.genre && movie.genre.length > 0 && (
              <span className="truncate">{movie.genre[0]}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MovieCard; 