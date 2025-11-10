const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Minimal profile data for privacy
  displayName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  // Watchlist and preferences
  watchlist: [{
    movieId: {
      type: String, // Changed to String to support TMDb IDs
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchHistory: [{
    movieId: {
      type: String, // Changed to String to support TMDb IDs
      required: true
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    duration: {
      type: Number, // Total duration in seconds
      default: 0
    },
    lastPosition: {
      type: Number, // Last watched position in seconds
      default: 0
    }
  }],
  preferences: {
    language: {
      type: String,
      default: 'English'
    },
    quality: {
      type: String,
      enum: ['1080p', '720p', '480p', '360p'],
      default: '720p'
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    subtitles: {
      type: Boolean,
      default: false
    }
  },
  // Simple user status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'watchHistory.movieId': 1 });
userSchema.index({ 'watchlist.movieId': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add movie to watchlist
userSchema.methods.addToWatchlist = function(movieId) {
  if (!this.watchlist.some(item => item.movieId === movieId)) {
    this.watchlist.push({ movieId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Remove movie from watchlist
userSchema.methods.removeFromWatchlist = function(movieId) {
  this.watchlist = this.watchlist.filter(item => item.movieId !== movieId);
  return this.save();
};

// Add to watch history with progress tracking
userSchema.methods.addToHistory = function(movieId, progress = 0, duration = 0, lastPosition = 0) {
  const existingIndex = this.watchHistory.findIndex(item => item.movieId === movieId);
  
  if (existingIndex >= 0) {
    this.watchHistory[existingIndex].watchedAt = new Date();
    this.watchHistory[existingIndex].progress = progress;
    this.watchHistory[existingIndex].duration = duration;
    this.watchHistory[existingIndex].lastPosition = lastPosition;
  } else {
    this.watchHistory.push({ 
      movieId, 
      progress, 
      duration, 
      lastPosition 
    });
  }
  
  // Keep only last 100 entries
  if (this.watchHistory.length > 100) {
    this.watchHistory = this.watchHistory.slice(-100);
  }
  
  return this.save();
};

// Get watch progress for a movie
userSchema.methods.getWatchProgress = function(movieId) {
  const historyItem = this.watchHistory.find(item => item.movieId === movieId);
  return historyItem ? {
    progress: historyItem.progress,
    lastPosition: historyItem.lastPosition,
    duration: historyItem.duration,
    watchedAt: historyItem.watchedAt
  } : null;
};

// Get sanitized user data (no sensitive info)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 