import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Star } from 'lucide-react';
import { useMovie } from '../../contexts/MovieContext';

const HeroSection = () => {
  const { useMoviesByCategory } = useMovie();
  const { data: featuredData } = useMoviesByCategory('featured', 5);
  const [currentMovie, setCurrentMovie] = useState(0);

  const featuredMovies = featuredData?.data || [];

  useEffect(() => {
    if (featuredMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentMovie((prev) => (prev + 1) % featuredMovies.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [featuredMovies.length]);

  if (featuredMovies.length === 0) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-br from-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to <span className="text-gradient">Kemo</span>
          </h1>
          <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Your ultimate destination for streaming the latest movies and TV shows
          </p>
          <Link
            to="/search"
            className="btn btn-primary btn-lg inline-flex items-center"
          >
            Start Exploring
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const movie = featuredMovies[currentMovie];

  return (
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
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            key={movie._id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Movie Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {movie.title}
            </h1>

            {/* Movie Info */}
            <div className="flex items-center space-x-4 mb-4 text-dark-300">
              <span>{movie.year}</span>
              {movie.duration > 0 && (
                <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
              )}
              {movie.rating > 0 && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>
              )}
              {movie.genre && movie.genre.length > 0 && (
                <span>{movie.genre[0]}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-lg text-dark-300 mb-8 line-clamp-3">
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={`/movie/${movie._id}`}
                className="btn btn-primary btn-lg inline-flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Now
              </Link>
              <Link
                to={`/movie/${movie._id}`}
                className="btn btn-outline btn-lg inline-flex items-center justify-center"
              >
                More Info
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Dots */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentMovie
                  ? 'bg-primary-500 scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection; 