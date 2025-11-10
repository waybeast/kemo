import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Grid, 
  List, 
  ChevronDown, 
  ChevronUp,
  Search,
  X,
  Star,
  Calendar,
  Clock
} from 'lucide-react';
import { useMovie } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Browse = () => {
  const { movies, genres, years, setGenre, setYear, setSort, resetFilters, trackPageView } = useMovie();
  const { isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = movies?.data || [];
  const pagination = movies?.pagination;

  useEffect(() => {
    trackPageView({
      page: 'browse',
      userId: isAuthenticated ? 'authenticated' : 'anonymous'
    });
  }, [trackPageView, isAuthenticated]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleYearToggle = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating === selectedRating ? 0 : rating);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedYears([]);
    setSelectedRating(0);
    setSearchQuery('');
    resetFilters();
  };

  const applyFilters = () => {
    // Apply selected filters to the context
    if (selectedGenres.length > 0) {
      setGenre(selectedGenres[0]); // For now, use first selected genre
    }
    if (selectedYears.length > 0) {
      setYear(selectedYears[0]); // For now, use first selected year
    }
    setSort(sortBy, sortOrder);
    setShowFilters(false);
  };

  const ratingOptions = [
    { value: 9, label: '9+ Stars' },
    { value: 8, label: '8+ Stars' },
    { value: 7, label: '7+ Stars' },
    { value: 6, label: '6+ Stars' },
    { value: 5, label: '5+ Stars' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'title', label: 'Title' },
    { value: 'year', label: 'Year' },
    { value: 'rating', label: 'Rating' },
    { value: 'views', label: 'Popularity' }
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Browse Movies</h1>
          <p className="text-gray-400">Discover your next favorite movie</p>
        </motion.div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white hover:bg-dark-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-dark-800 border border-dark-600 rounded-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Genres */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Genres
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {genres?.map((genre) => (
                      <label key={genre} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-gray-300 text-sm">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Years */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Years
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {yearOptions.map((year) => (
                      <label key={year} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedYears.includes(year)}
                          onChange={() => handleYearToggle(year)}
                          className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-gray-300 text-sm">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Rating
                  </h3>
                  <div className="space-y-2">
                    {ratingOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={selectedRating === option.value}
                          onChange={() => handleRatingChange(option.value)}
                          className="border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-gray-300 text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Sort By</h3>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          sortBy === option.value
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-dark-700'
                        }`}
                      >
                        {option.label}
                        {sortBy === option.value && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-dark-600">
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters */}
        {(selectedGenres.length > 0 || selectedYears.length > 0 || selectedRating > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm flex items-center gap-1"
              >
                {genre}
                <button
                  onClick={() => handleGenreToggle(genre)}
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedYears.map((year) => (
              <span
                key={year}
                className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm flex items-center gap-1"
              >
                {year}
                <button
                  onClick={() => handleYearToggle(year)}
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedRating > 0 && (
              <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm flex items-center gap-1">
                {selectedRating}+ Stars
                <button
                  onClick={() => setSelectedRating(0)}
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            {searchResults.length} movies found
          </p>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-white"
            >
              <option value="createdAt-desc">Latest</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="year-desc">Newest Year</option>
              <option value="year-asc">Oldest Year</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
              <option value="views-desc">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Movies Grid/List */}
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' : 'space-y-4'}>
            <AnimatePresence>
              {searchResults.map((movie, index) => (
                <motion.div
                  key={movie.id || movie._id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={viewMode === 'list' ? 'flex gap-4 bg-dark-800 rounded-lg p-4' : ''}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse; 