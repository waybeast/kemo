import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Verify token on app load
  const { isLoading: isVerifying } = useQuery(
    ['verifyToken'],
    async () => {
      if (!state.token) throw new Error('No token');
      const response = await api.get('/api/auth/verify');
      return response.data.data.user;
    },
    {
      enabled: !!state.token,
      retry: false,
      onSuccess: (user) => {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: state.token } });
      },
      onError: () => {
        dispatch({ type: 'LOGIN_FAILURE' });
        localStorage.removeItem('token');
      },
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    async ({ username, password, rememberMe }) => {
      const response = await api.post('/api/auth/login', { username, password, rememberMe });
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Login failed';
        throw new Error(message);
      },
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    async ({ username, email, password }) => {
      const response = await api.post('/api/auth/register', { username, email, password });
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Registration failed';
        throw new Error(message);
      },
    }
  );

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      queryClient.clear();
      toast.success('Logged out successfully');
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await api.put('/api/auth/profile', profileData);
      return response.data.data;
    },
    {
      onSuccess: (user) => {
        dispatch({ type: 'UPDATE_USER', payload: user });
        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to update profile';
        toast.error(message);
      },
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (passwordData) => {
      const response = await api.put('/api/auth/change-password', passwordData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully!');
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to change password';
        toast.error(message);
      },
    }
  );

  // Watchlist mutations
  const addToWatchlistMutation = useMutation(
    async (movieId) => {
      const response = await api.post(`/api/auth/watchlist/${movieId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Added to watchlist!');
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to add to watchlist';
        toast.error(message);
      },
    }
  );

  const removeFromWatchlistMutation = useMutation(
    async (movieId) => {
      const response = await api.delete(`/api/auth/watchlist/${movieId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Removed from watchlist!');
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to remove from watchlist';
        toast.error(message);
      },
    }
  );

  // Add to history mutation
  const addToHistoryMutation = useMutation(
    async ({ movieId, progress }) => {
      const response = await api.post(`/api/auth/history/${movieId}`, { progress });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        console.error('Failed to update watch history:', error);
      },
    }
  );

  const value = {
    ...state,
    isLoading: state.isLoading || isVerifying,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    addToWatchlist: addToWatchlistMutation.mutateAsync,
    removeFromWatchlist: removeFromWatchlistMutation.mutateAsync,
    addToHistory: addToHistoryMutation.mutateAsync,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isChangingPassword: changePasswordMutation.isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 