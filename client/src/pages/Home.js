import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovie } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import MovieCarousel from '../components/movies/MovieCarousel';
import HeroSection from '../components/home/HeroSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Home = () => {
  const [searchParams] = useSearchParams();
  const { trackPageView } = useMovie();
  const { isAuthenticated } = useAuth();
  const category = searchParams.get('category');

  useEffect(() => {
    // Temporarily disable analytics to prevent freezing
    // trackPageView({
    //   page: 'home',
    //   category: category || 'all',
    //   userId: isAuthenticated ? 'authenticated' : 'anonymous'
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, isAuthenticated]); // Removed trackPageView from dependencies

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Movie Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Movies */}
        <MovieCarousel
          title="Featured Movies"
          category="featured"
          limit={10}
          className="mb-12"
        />

        {/* Latest Movies */}
        <MovieCarousel
          title="Latest Releases"
          category="latest"
          limit={10}
          className="mb-12"
        />

        {/* Popular Movies */}
        <MovieCarousel
          title="Popular Movies"
          category="popular"
          limit={10}
          className="mb-12"
        />

        {/* Action Movies */}
        <MovieCarousel
          title="Action & Adventure"
          category="Action"
          limit={10}
          className="mb-12"
        />

        {/* Drama Movies */}
        <MovieCarousel
          title="Drama"
          category="Drama"
          limit={10}
          className="mb-12"
        />

        {/* Comedy Movies */}
        <MovieCarousel
          title="Comedy"
          category="Comedy"
          limit={10}
          className="mb-12"
        />

        {/* Horror Movies */}
        <MovieCarousel
          title="Horror & Thriller"
          category="Horror"
          limit={10}
          className="mb-12"
        />

        {/* Sci-Fi Movies */}
        <MovieCarousel
          title="Science Fiction"
          category="Sci-Fi"
          limit={10}
          className="mb-12"
        />
      </div>
    </div>
  );
};

export default Home; 