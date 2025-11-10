import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Heart, Star, Clock, Calendar, User, Eye, Share2, Download } from 'lucide-react';
import { useMovie } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import MoviePlayer from '../components/movies/MoviePlayer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MovieCard from '../components/movies/MovieCard';

const MovieDetail = () => {
  const { id } = useParams();
  const { getMovieById, getMoviesByCategory, trackPageView } = useMovie();
  const { isAuthenticated, addToWatchlist, removeFromWatchlist, addToHistory } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const { data: movieData, isLoading, error } = getMovieById(id);
  const { data: relatedData } = getMoviesByCategory('all', 6);

  const movie = movieData?.data;
  const relatedMovies = relatedData?.data || [];

  useEffect(() => {
    if (movie) {
      trackPageView({
        page: 'movie-detail',
        movieId: movie._id,
        title: movie.title,
        userId: isAuthenticated ? 'authenticated' : 'anonymous'
      });
    }
  }, [movie, trackPageView, isAuthenticated]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (isAuthenticated) {
      addToHistory(movie._id, 0);
    }
  };

  const handleWatchlistToggle = () => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    if (isInWatchlist) {
      removeFromWatchlist(movie._id);
      setIsInWatchlist(false);
    } else {
      addToWatchlist(movie._id);
      setIsInWatchlist(true);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Movie not found</h1>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Movie Player Modal */}
      {isPlaying && (
        <MoviePlayer
          movie={movie}
          quality={selectedQuality}
          onClose={() => setIsPlaying(false)}
        />
      )}

      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-900/50 to-dark-800/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0"
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                />
              </motion.div>

              {/* Movie Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  {movie.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-dark-300">
                  {movie.year && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{movie.year}</span>
                    </div>
                  )}
                  {movie.duration > 0 && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDuration(movie.duration)}</span>
                    </div>
                  )}
                  {movie.rating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {movie.views > 0 && (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{movie.views.toLocaleString()} views</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movie.genre && movie.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.genre.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-dark-700 text-white rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-lg text-dark-300 mb-6 leading-relaxed">
                  {movie.description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handlePlay}
                    className="btn btn-primary btn-lg inline-flex items-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </button>
                  <button
                    onClick={handleWatchlistToggle}
                    className={`btn btn-outline btn-lg inline-flex items-center ${
                      isInWatchlist ? 'text-red-500 border-red-500' : ''
                    }`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isInWatchlist ? 'fill-current' : ''}`} />
                    {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Synopsis */}
            {movie.synopsis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
                <p className="text-dark-300 leading-relaxed">{movie.synopsis}</p>
              </motion.div>
            )}

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Cast</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {movie.cast.map((actor, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {actor.image && (
                        <img
                          src={actor.image}
                          alt={actor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-white">{actor.name}</p>
                        <p className="text-sm text-dark-400">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Director */}
            {movie.director && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Director</h2>
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-dark-400" />
                  <span className="text-dark-300">{movie.director}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Release Date */}
            {movie.releaseDate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Release Date</h3>
                <p className="text-dark-300">{formatDate(movie.releaseDate)}</p>
              </motion.div>
            )}

            {/* Language */}
            {movie.language && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Language</h3>
                <p className="text-dark-300">{movie.language}</p>
              </motion.div>
            )}

            {/* Tags */}
            {movie.tags && movie.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-dark-700 text-white rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedMovies
                .filter(m => m._id !== movie._id)
                .slice(0, 6)
                .map((relatedMovie) => (
                  <MovieCard key={relatedMovie._id} movie={relatedMovie} />
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail; 