import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { MovieProvider } from './contexts/MovieContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Search from './pages/Search';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import MoviePlayer from './pages/MoviePlayer';
import NotFound from './pages/NotFound';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MovieProvider>
          <Router>
            <div className="min-h-screen bg-dark-950 text-white">
              <Navbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/watch/:id" element={<MoviePlayer />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </MovieProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 