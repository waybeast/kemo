import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Film } from 'lucide-react';

/**
 * SearchSuggestions Component
 * Displays autocomplete suggestions dropdown for search
 * 
 * Features:
 * - Shows up to 10 movie suggestions
 * - Displays poster, title, year, and rating
 * - Highlights matching text
 * - Supports keyboard navigation
 * - Loading and empty states
 * 
 * @param {Array} suggestions - Array of movie objects from TMDb
 * @param {string} query - The search query for highlighting
 * @param {number} selectedIndex - Currently selected suggestion index
 * @param {Function} onSelect - Callback when suggestion is clicked
 * @param {boolean} isLoading - Loading state
 */
const SearchSuggestions = ({ 
  suggestions, 
  query, 
  selectedIndex, 
  onSelect, 
  isLoading 
}) => {
  /**
   * Highlight matching text in the title
   */
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    try {
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="text-primary-400 font-semibold">{part}</span>
        ) : (
          <span key={index}>{part}</span>
        )
      );
    } catch (error) {
      // If regex fails, return original text
      return text;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-full mt-2 w-full bg-dark-800 rounded-lg shadow-xl border border-dark-600 p-4 z-50"
      >
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
          <span>Searching...</span>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-full mt-2 w-full bg-dark-800 rounded-lg shadow-xl border border-dark-600 p-4 z-50"
      >
        <p className="text-gray-400 text-center text-sm">
          No results found for "{query}"
        </p>
        <p className="text-gray-500 text-center text-xs mt-2">
          Try different keywords or browse popular movies
        </p>
      </motion.div>
    );
  }

  // Suggestions list
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full mt-2 w-full bg-dark-800 rounded-lg shadow-xl border border-dark-600 max-h-96 overflow-y-auto z-50"
    >
      {suggestions.map((movie, index) => (
        <button
          key={movie.id}
          onClick={() => onSelect(movie)}
          className={`w-full flex items-center space-x-3 p-3 hover:bg-dark-700 transition-colors ${
            index === selectedIndex ? 'bg-dark-700' : ''
          } ${index === 0 ? 'rounded-t-lg' : ''} ${
            index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-dark-600'
          }`}
        >
          {/* Movie Poster */}
          <div className="flex-shrink-0 w-12 h-16 bg-dark-700 rounded overflow-hidden">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                alt={movie.title || movie.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Film className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="flex-1 text-left min-w-0">
            <h4 className="text-white font-medium line-clamp-1 text-sm">
              {highlightMatch(movie.title || movie.name, query)}
            </h4>
            <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
              {(movie.release_date || movie.first_air_date) && (
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(movie.release_date || movie.first_air_date).getFullYear()}
                </span>
              )}
              {movie.vote_average > 0 && (
                <span className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.media_type && (
                <span className="px-2 py-0.5 bg-dark-600 rounded text-xs">
                  {movie.media_type === 'tv' ? 'TV' : 'Movie'}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </motion.div>
  );
};

export default SearchSuggestions;
