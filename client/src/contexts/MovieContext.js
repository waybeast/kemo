import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const MovieContext = createContext();

export const useMovie = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovie must be used within a MovieProvider');
  }
  return context;
};

export const MovieProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Custom hook for movies by category
  const useMoviesByCategory = (category, limit = 20) => {
    return useQuery(
      ['movies', 'category', category, limit],
      async () => {
        const response = await axios.get(`/api/movies/category/${category}?limit=${limit}`);
        return response.data;
      },
      {
        enabled: !!category,
        staleTime: 10 * 60 * 1000, // Increased from 5 to 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes cache
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnMount: false, // Don't refetch on component mount if data exists
      }
    );
  };

  // Custom hook for movie by ID
  const useMovieById = (id) => {
    return useQuery(
      ['movie', id],
      async () => {
        const response = await axios.get(`/api/movies/${id}`);
        return response.data;
      },
      {
        enabled: !!id,
        staleTime: 15 * 60 * 1000, // Increased from 10 to 15 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );
  };

  // Custom hook for streaming URLs
  const useStreamingUrls = (movieId, quality) => {
    return useQuery(
      ['streaming', movieId, quality],
      async () => {
        const params = quality ? `?quality=${quality}` : '';
        const response = await axios.get(`/api/movies/${movieId}/stream${params}`);
        return response.data;
      },
      {
        enabled: !!movieId,
        staleTime: 5 * 60 * 1000, // Increased from 2 to 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );
  };

  // Custom hook for search movies
  const useSearchMovies = (query, limit = 20) => {
    return useQuery(
      ['search', query, limit],
      async () => {
        const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        return response.data;
      },
      {
        enabled: !!query && query.length >= 2,
        staleTime: 5 * 60 * 1000, // Increased from 2 to 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes cache
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );
  };

  // Regular async functions for direct calls (not hooks)
  const getMoviesByCategory = async (category, limit = 20) => {
    try {
      const response = await axios.get(`/api/movies/category/${category}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by category:', error);
      throw error;
    }
  };

  const getMovieById = async (id) => {
    try {
      const response = await axios.get(`/api/movies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movie by ID:', error);
      throw error;
    }
  };

  const getStreamingUrls = async (movieId, quality) => {
    try {
      const params = quality ? `?quality=${quality}` : '';
      const response = await axios.get(`/api/movies/${movieId}/stream${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching streaming URLs:', error);
      throw error;
    }
  };

  const searchMovies = async (query, limit = 20) => {
    try {
      const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  };

  // Get genres
  const getGenres = useQuery(
    ['genres'],
    async () => {
      const response = await axios.get('/api/movies/genres/list');
      return response.data;
    },
    {
      staleTime: 60 * 60 * 1000, // Increased from 30 to 60 minutes
      cacheTime: 120 * 60 * 1000, // 2 hours cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Get years
  const getYears = useQuery(
    ['years'],
    async () => {
      const response = await axios.get('/api/movies/years/list');
      return response.data;
    },
    {
      staleTime: 60 * 60 * 1000, // Increased from 30 to 60 minutes
      cacheTime: 120 * 60 * 1000, // 2 hours cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Track page view
  const trackPageView = useMutation(
    async (data) => {
      const response = await axios.post('/api/analytics/track', data);
      return response.data;
    },
    {
      onError: (error) => {
        console.error('Failed to track page view:', error);
      },
      retry: 1, // Only retry once
      retryDelay: 1000, // Wait 1 second before retry
    }
  );

  // Get analytics stats
  const getAnalyticsStats = useQuery(
    ['analytics', 'stats'],
    async () => {
      const response = await axios.get('/api/analytics/stats');
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000, // Increased from 5 to 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Get all movies with pagination
  const getAllMovies = useQuery(
    ['movies', 'all'],
    async () => {
      const response = await axios.get('/api/movies?page=1&limit=20&sort=createdAt&order=desc');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // Increased from 2 to 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const value = {
    // Hook-based functions (for components that need reactive data)
    useMoviesByCategory,
    useMovieById,
    useStreamingUrls,
    useSearchMovies,
    
    // Regular async functions (for direct calls)
    getMoviesByCategory,
    getMovieById,
    getStreamingUrls,
    searchMovies,
    
    // Other data
    getGenres,
    getYears,
    getAllMovies,
    getAnalyticsStats,
    
    // Mutations
    trackPageView: trackPageView.mutate, // This is correct - it's the mutate function
    
    // Query client for manual cache management
    queryClient,
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}; 