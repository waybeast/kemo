import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import SearchSuggestions from './SearchSuggestions';

/**
 * SearchBar Component
 * Intelligent search input with debouncing and autocomplete
 * 
 * Features:
 * - 500ms debounce delay
 * - TMDb autocomplete suggestions
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - Click outside to close
 * - Loading indicator
 * - Minimum 2 characters before search
 * 
 * @param {Function} onSearch - Callback when search is submitted
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes
 */
const SearchBar = ({ 
  onSearch, 
  placeholder = 'Search movies...', 
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Debounce the search query (500ms delay)
  const debouncedQuery = useDebounce(query, 500);
  
  // Fetch suggestions when debounced query changes
  const { suggestions, isLoading } = useSearchSuggestions(debouncedQuery);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleDirectSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleDirectSearch();
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      default:
        break;
    }
  };

  /**
   * Handle direct search submission (Enter without selecting suggestion)
   */
  const handleDirectSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      
      if (onSearch) {
        onSearch(query.trim());
      }
      
      // Navigate to search page
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  /**
   * Handle suggestion selection
   */
  const handleSelectSuggestion = (movie) => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Navigate to movie detail page
    navigate(`/movie/${movie.id}`);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  /**
   * Handle input focus
   */
  const handleFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  /**
   * Close suggestions when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleDirectSearch(); }}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-10 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            autoComplete="off"
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-dark-400" />
          </div>
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && query.length >= 2 && (
        <SearchSuggestions
          suggestions={suggestions}
          query={query}
          selectedIndex={selectedIndex}
          onSelect={handleSelectSuggestion}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default SearchBar;
