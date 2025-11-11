import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useMovie } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';


const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { useSearchMovies, getGenres, getYears, trackPageView } = useMovie();
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'createdAt');
  const [showFilters, setShowFilters] = useState(false);

  // Use the search hook
  const query = searchParams.get('q') || '';
  const { data: searchData, isLoading } = useSearchMovies(query);
  
  // Get genres and years
  const genres = getGenres;
  const years = getYears;

  const searchResults = searchData?.data || [];
  const pagination = searchData?.pagination;

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      // Track page view when query changes
      trackPageView({
        page: 'search',
        query,
        userId: isAuthenticated ? 'authenticated' : 'anonymous'
      });
    }
  }, [searchParams.get('q'), trackPageView, isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchTerm.trim());
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedYear) params.set('year', selectedYear);
      if (selectedSort) params.set('sort', selectedSort);
      setSearchParams(params);
    }
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    updateSearchParams('genre', genre);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    updateSearchParams('year', year);
  };

  const handleSortChange = (sort) => {
    setSelectedSort(sort);
    updateSearchParams('sort', sort);
  };

  const updateSearchParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedSort('createdAt');
    setSearchParams({ q: searchTerm });
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'title', label: 'Title' },
    { value: 'year', label: 'Year' },
    { value: 'rating', label: 'Rating' },
    { value: 'views', label: 'Popularity' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-4">Search Movies</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for movies, actors, or genres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary px-6"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline px-4"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {/* Active Filters */}
          {(selectedGenre || selectedYear || selectedSort !== 'createdAt') && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-dark-300">Active filters:</span>
              {selectedGenre && (
                <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm flex items-center">
                  {selectedGenre}
                  <button
                    onClick={() => handleGenreChange('')}
                    className="ml-2 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedYear && (
                <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm flex items-center">
                  {selectedYear}
                  <button
                    onClick={() => handleYearChange('')}
                    className="ml-2 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Genre Filter */}
                <div>
                  <label className="block text-white font-medium mb-2">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => handleGenreChange(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Genres</option>
                    {genres?.data?.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-white font-medium mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Years</option>
                    {years?.data?.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-white font-medium mb-2">Sort By</label>
                  <select
                    value={selectedSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <div className="mb-8">
          {searchParams.get('q') && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Search Results for "{searchParams.get('q')}"
                {pagination && (
                  <span className="text-dark-400 font-normal ml-2">
                    ({pagination.totalDocs} movies found)
                  </span>
                )}
              </h2>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
            >
              {searchResults.map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* No Results */}
          {!isLoading && searchResults.length === 0 && searchParams.get('q') && (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
              <p className="text-dark-400 mb-4">
                Try adjusting your search terms or filters
              </p>
              <button
                onClick={clearFilters}
                className="btn btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newPage = pagination.page - 1;
                    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage });
                  }}
                  disabled={!pagination.hasPrevPage}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="text-dark-300 px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => {
                    const newPage = pagination.page + 1;
                    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage });
                  }}
                  disabled={!pagination.hasNextPage}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Popular Searches */}
        {!searchParams.get('q') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Popular Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSearchTerm(genre);
                    handleGenreChange(genre);
                  }}
                  className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
                >
                  <h3 className="font-medium text-white mb-1">{genre}</h3>
                  <p className="text-sm text-dark-400">Movies</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Search; 