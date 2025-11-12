const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');
const telegramRoutes = require('./routes/telegram');
const analyticsRoutes = require('./routes/analytics');
const tmdbRoutes = require('./routes/tmdb');
const streamingRoutes = require('./routes/streaming');
const { schedulePeriodicCacheWarming } = require('./middleware/cacheMiddleware');
const { 
  metricsMiddleware, 
  getMetrics, 
  getMetricsContentType,
  updateDbConnectionPool 
} = require('./middleware/metricsMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.telegram.org", "https://api.themoviedb.org"]
    }
  }
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting - More generous limits for movie streaming app
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// More generous rate limiting for movie data (frequently accessed)
const movieLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per 15 minutes for movie data
  message: 'Too many movie requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

// Apply specific rate limiting to movie routes
app.use('/api/movies', movieLimiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://kemo.vercel.app',
    'https://kemo-*.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus metrics middleware (should be early in the chain)
app.use(metricsMiddleware);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kemo-streaming', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Schedule periodic cache warming (every 30 minutes)
  schedulePeriodicCacheWarming(30);
  
  // Update database connection pool metrics periodically
  setInterval(() => {
    const poolStats = mongoose.connection.db?.serverConfig?.s?.pool;
    if (poolStats) {
      const total = poolStats.totalConnectionCount || 0;
      const available = poolStats.availableConnectionCount || 0;
      const active = total - available;
      updateDbConnectionPool(active, available, total);
    }
  }, 10000); // Update every 10 seconds
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/streaming', streamingRoutes);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', getMetricsContentType());
    const metrics = await getMetrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 