import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMovie } from '../../contexts/MovieContext';
import { Search, Menu, X, User, LogOut, Heart, Settings, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '../search/SearchBar';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { setSearchQuery: setGlobalSearchQuery } = useMovie();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile search when navigating away from search page
  useEffect(() => {
    if (location.pathname !== '/search') {
      setIsSearchOpen(false);
    }
  }, [location.pathname]);

  const handleSearch = (query) => {
    setGlobalSearchQuery(query);
    setIsSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Browse', path: '/browse' },
    { name: 'Latest', path: '/?category=latest' },
    { name: 'Popular', path: '/?category=popular' },
    { name: 'Genres', path: '/?category=genres' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-gradient">Kemo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-dark-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search movies..."
            />
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:block font-medium">
                    {user?.displayName || user?.username}
                  </span>
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-600 py-2"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Watchlist
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Clock className="w-4 h-4 mr-3" />
                        Watch History
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <hr className="border-dark-600 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-dark-300 hover:text-white transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4"
            >
              <SearchBar 
                onSearch={handleSearch}
                placeholder="Search movies..."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-dark-600"
            >
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-dark-300 hover:text-white transition-colors duration-200 font-medium py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <>
                    <hr className="border-dark-600 my-2" />
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-dark-300 hover:text-white transition-colors font-medium py-2"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn btn-primary w-full justify-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar; 