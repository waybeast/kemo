import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

/**
 * Custom hook to fetch search suggestions from TMDb API
 * Features:
 * - Automatic request cancellation for outdated queries
 * - In-memory caching with 5-minute TTL
 * - Only fetches when query length >= 2 characters
 * - Returns suggestions, loading state, and error state
 * 
 * @param {string} query - The search query
 * @returns {Object} { suggestions, isLoading, error }
 * 
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * const { suggestions, isLoading } = useSearchSuggestions(debouncedQuery);
 */
export const useSearchSuggestions = (query) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache to store search results (in-memory)
  const cacheRef = useRef(new Map());
  
  // AbortController to cancel outdated requests
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Don't search if query is too short
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const trimmedQuery = query.trim();

    // Check cache first
    if (cacheRef.current.has(trimmedQuery)) {
      const cached = cacheRef.current.get(trimmedQuery);
      // Check if cache is still valid (5 minutes)
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setSuggestions(cached.data);
        setIsLoading(false);
        return;
      } else {
        // Remove expired cache entry
        cacheRef.current.delete(trimmedQuery);
      }
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(getApiUrl('/api/movies/search'), {
          params: {
            query: trimmedQuery,
            limit: 10
          },
          signal: abortControllerRef.current.signal
        });

        const results = response.data.data || [];
        
        // Cache the results with timestamp
        cacheRef.current.set(trimmedQuery, {
          data: results,
          timestamp: Date.now()
        });

        // Limit cache size to 50 entries (prevent memory leak)
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }

        setSuggestions(results);
      } catch (err) {
        // Don't set error for cancelled requests
        if (err.name !== 'CanceledError' && !axios.isCancel(err)) {
          console.error('Search suggestions error:', err);
          setError(err.message || 'Failed to fetch suggestions');
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  return { suggestions, isLoading, error };
};

export default useSearchSuggestions;
