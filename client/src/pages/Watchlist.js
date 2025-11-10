import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Trash2, 
  Play,
  Calendar,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMovie } from '../contexts/MovieContext';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Watchlist = () => {
  const { user, isAuthenticated, removeFromWatchlist } = useAuth();
  const { trackPageView } = useMovie();

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('added');
  const [filterGenre, setFilterGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock watchlist data - in real app, this would come from the backend
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    trackPageView({
      page: 'watchlist',
      userId: user?.id || 'authenticated'
    });

    // Load watchlist data
    loadWatchlist();
  }, [isAuthenticated, trackPageView, user]);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/auth/watchlist');
      // setWatchlist(response.data.data);
      
      // For now, using mock data
      setTimeout(() => {
        setWatchlist([
          {
            id: 1,
            title: "Inception",
            poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            year: 2010,
            rating: 8.8,
            genre: ["Sci-Fi", "Action"],
            addedAt: "2024-01-15"
          },
          {
            id: 2,
            title: "The Dark Knight",
            poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            year: 2008,
            rating: 9.0,
            genre: ["Action", "Crime"],
            addedAt: "2024-01-10"
          },
          {
            id: 3,
            title: "Pulp Fiction",
            poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            year: 1994,
            rating: 8.9,
            genre: ["Crime", "Drama"],
            addedAt: "2024-01-05"
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      setIsLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      await removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(movie => movie.id !== movieId));
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const handlePlayMovie = (movie) => {
    // Navigate to movie player
    window.location.href = `/watch/${movie.id}`;
  };

  // Filter and sort watchlist
  const filteredWatchlist = watchlist
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === 'all' || movie.genre.includes(filterGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return b.year - a.year;
        case 'rating':
          return b.rating - a.rating;
        case 'added':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });

  const genres = ['all', ...Array.from(new Set(watchlist.flatMap(movie => movie.genre)))];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please log in to view your watchlist</h2>
          <p className="text-gray-400">You need to be authenticated to access this page.</p>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
              <p className="text-gray-400">
                {watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} in your watchlist
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-dark-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre} className="bg-dark-800">
                    {genre === 'all' ? 'All Genres' : genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="added" className="bg-dark-800">Recently Added</option>
                <option value="title" className="bg-dark-800">Title A-Z</option>
                <option value="year" className="bg-dark-800">Year (Newest)</option>
                <option value="rating" className="bg-dark-800">Rating (High)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-400">
            Showing {filteredWatchlist.length} of {watchlist.length} movies
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && watchlist.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Heart className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start building your watchlist by adding movies you want to watch later.
            </p>
            <button
              onClick={() => window.location.href = '/browse'}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Movies
            </button>
          </motion.div>
        )}

        {/* No Search Results */}
        {!isLoading && watchlist.length > 0 && filteredWatchlist.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">No movies found</h3>
            <p className="text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </motion.div>
        )}

        {/* Movie Grid */}
        {!isLoading && filteredWatchlist.length > 0 && viewMode === 'grid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            <AnimatePresence>
              {filteredWatchlist.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative group"
                >
                  <MovieCard movie={movie} />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePlayMovie(movie)}
                        className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                        title="Play Movie"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromWatchlist(movie.id)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Movie List */}
        {!isLoading && filteredWatchlist.length > 0 && viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {filteredWatchlist.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Movie Poster */}
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    {/* Movie Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{movie.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {movie.year}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {movie.rating}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(movie.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {movie.genre.map(genre => (
                          <span
                            key={genre}
                            className="px-2 py-1 bg-dark-600 text-gray-300 text-xs rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePlayMovie(movie)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </button>
                      <button
                        onClick={() => handleRemoveFromWatchlist(movie.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Watchlist; 