import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieCard from './MovieCard';
import { useMovie } from '../../contexts/MovieContext';

const MovieCarousel = ({ title, category, limit = 10, className = '' }) => {
  const { useMoviesByCategory } = useMovie();
  const { data, isLoading, error } = useMoviesByCategory(category, limit);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48">
              <div className="loading-skeleton h-72 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data || data.data.length === 0) {
    return null;
  }

  const movies = data.data;

  const scrollContainer = (direction) => {
    const container = document.getElementById(`carousel-${category}`);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scrollContainer('left')}
            className="p-2 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollContainer('right')}
            className="p-2 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors text-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div
          id={`carousel-${category}`}
          className="movie-carousel"
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id || movie._id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>

        {/* Gradient overlays for smooth scrolling effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-dark-950 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none z-10" />
      </div>
    </motion.div>
  );
};

export default MovieCarousel; 