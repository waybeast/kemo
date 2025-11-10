const axios = require('axios');

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = 'https://api.themoviedb.org/3';
    this.imageBaseURL = 'https://image.tmdb.org/t/p';
    
    if (!this.apiKey) {
      console.warn('TMDb API key not found. TMDb integration will be disabled.');
    }
  }

  // Helper method to make API requests
  async makeRequest(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('TMDb API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('TMDb API request failed:', error.message);
      throw error;
    }
  }

  // Get popular movies
  async getPopularMovies(page = 1, language = 'en-US') {
    return this.makeRequest('/movie/popular', {
      page,
      language
    });
  }

  // Get latest movies
  async getLatestMovies(page = 1, language = 'en-US') {
    return this.makeRequest('/movie/now_playing', {
      page,
      language
    });
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1, language = 'en-US') {
    return this.makeRequest('/movie/top_rated', {
      page,
      language
    });
  }

  // Get upcoming movies
  async getUpcomingMovies(page = 1, language = 'en-US') {
    return this.makeRequest('/movie/upcoming', {
      page,
      language
    });
  }

  // Get movies by genre
  async getMoviesByGenre(genreId, page = 1, language = 'en-US') {
    return this.makeRequest('/discover/movie', {
      with_genres: genreId,
      page,
      language,
      sort_by: 'popularity.desc'
    });
  }

  // Get movie details by ID
  async getMovieDetails(movieId, language = 'en-US') {
    return this.makeRequest(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits,videos,images,similar'
    });
  }

  // Search movies
  async searchMovies(query, page = 1, language = 'en-US') {
    return this.makeRequest('/search/movie', {
      query,
      page,
      language
    });
  }

  // Get movie genres
  async getGenres(language = 'en-US') {
    return this.makeRequest('/genre/movie/list', {
      language
    });
  }

  // Get trending movies (day/week)
  async getTrendingMovies(timeWindow = 'week', page = 1) {
    return this.makeRequest(`/trending/movie/${timeWindow}`, {
      page
    });
  }

  // Get movie recommendations
  async getMovieRecommendations(movieId, page = 1, language = 'en-US') {
    return this.makeRequest(`/movie/${movieId}/recommendations`, {
      page,
      language
    });
  }

  // Get movie credits (cast & crew)
  async getMovieCredits(movieId, language = 'en-US') {
    return this.makeRequest(`/movie/${movieId}/credits`, {
      language
    });
  }

  // Get movie videos (trailers, etc.)
  async getMovieVideos(movieId, language = 'en-US') {
    return this.makeRequest(`/movie/${movieId}/videos`, {
      language
    });
  }

  // Get movie images
  async getMovieImages(movieId, language = 'en-US') {
    return this.makeRequest(`/movie/${movieId}/images`, {
      language
    });
  }

  // Helper method to get image URL
  getImageURL(path, size = 'w500') {
    if (!path) return null;
    return `${this.imageBaseURL}/${size}${path}`;
  }

  // Helper method to get poster URL
  getPosterURL(path, size = 'w500') {
    return this.getImageURL(path, size);
  }

  // Helper method to get backdrop URL
  getBackdropURL(path, size = 'w1280') {
    return this.getImageURL(path, size);
  }

  // Helper method to get profile URL (for cast)
  getProfileURL(path, size = 'w185') {
    return this.getImageURL(path, size);
  }

  // Transform TMDb movie data to our format
  transformMovieData(tmdbMovie) {
    return {
      title: tmdbMovie.title,
      originalTitle: tmdbMovie.original_title,
      description: tmdbMovie.overview,
      releaseDate: tmdbMovie.release_date,
      year: new Date(tmdbMovie.release_date).getFullYear(),
      rating: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
      poster: this.getPosterURL(tmdbMovie.poster_path),
      backdrop: this.getBackdropURL(tmdbMovie.backdrop_path),
      genre: tmdbMovie.genre_ids || [],
      runtime: tmdbMovie.runtime,
      status: tmdbMovie.status,
      language: tmdbMovie.original_language,
      budget: tmdbMovie.budget,
      revenue: tmdbMovie.revenue,
      tmdbId: tmdbMovie.id,
      imdbId: tmdbMovie.imdb_id,
      isAdult: tmdbMovie.adult,
      isVideo: tmdbMovie.video,
      streamingUrls: [], // Will be populated from our database or Telegram
      isActive: true,
      isFeatured: tmdbMovie.popularity > 50,
      isLatest: new Date(tmdbMovie.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      isPopular: tmdbMovie.vote_average > 7.0,
      views: Math.floor(tmdbMovie.popularity * 100)
    };
  }

  // Transform TMDb movie details to our format
  transformMovieDetails(tmdbMovie) {
    const base = this.transformMovieData(tmdbMovie);
    
    return {
      ...base,
      cast: tmdbMovie.credits?.cast?.slice(0, 10).map(actor => ({
        name: actor.name,
        character: actor.character,
        profile: this.getProfileURL(actor.profile_path),
        order: actor.order
      })) || [],
      director: tmdbMovie.credits?.crew?.find(member => member.job === 'Director')?.name || '',
      genres: tmdbMovie.genres?.map(genre => genre.name) || [],
      productionCompanies: tmdbMovie.production_companies?.map(company => company.name) || [],
      videos: tmdbMovie.videos?.results?.filter(video => video.site === 'YouTube') || [],
      similarMovies: tmdbMovie.similar?.results?.slice(0, 6).map(movie => this.transformMovieData(movie)) || []
    };
  }

  // Get featured movies (combination of popular and latest)
  async getFeaturedMovies(limit = 10) {
    try {
      const [popular, latest] = await Promise.all([
        this.getPopularMovies(1, 'en-US'),
        this.getLatestMovies(1, 'en-US')
      ]);

      const allMovies = [
        ...popular.results.map(movie => ({ ...movie, source: 'popular' })),
        ...latest.results.map(movie => ({ ...movie, source: 'latest' }))
      ];

      // Remove duplicates and sort by popularity
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      return uniqueMovies
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit)
        .map(movie => this.transformMovieData(movie));
    } catch (error) {
      console.error('Error fetching featured movies:', error);
      return [];
    }
  }

  // Sync movies from TMDb to our database
  async syncMoviesToDatabase(movieIds, Movie) {
    console.log('Starting syncMoviesToDatabase with IDs:', movieIds);
    const syncedMovies = [];
    
    for (const tmdbId of movieIds) {
      try {
        console.log(`Processing movie ID: ${tmdbId}`);
        
        // Check if movie already exists
        const existingMovie = await Movie.findOne({ tmdbId });
        if (existingMovie) {
          console.log(`Movie ${tmdbId} already exists, skipping`);
          syncedMovies.push(existingMovie);
          continue;
        }

        console.log(`Fetching movie details for ID: ${tmdbId}`);
        // Fetch movie details from TMDb
        const tmdbMovie = await this.getMovieDetails(tmdbId);
        const movieData = this.transformMovieDetails(tmdbMovie);
        console.log(`Transformed movie data for: ${movieData.title}`);

        // Create new movie in database
        const newMovie = new Movie(movieData);
        await newMovie.save();
        console.log(`Successfully saved movie: ${movieData.title}`);
        
        syncedMovies.push(newMovie);
        console.log(`Synced movie: ${movieData.title}`);
      } catch (error) {
        console.error(`Error syncing movie ${tmdbId}:`, error.message);
      }
    }

    console.log(`Sync completed. Total synced: ${syncedMovies.length}`);
    return syncedMovies;
  }
}

module.exports = new TMDBService(); 