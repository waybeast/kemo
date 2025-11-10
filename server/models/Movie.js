const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  originalTitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  synopsis: {
    type: String,
    default: ''
  },
  genre: [{
    type: String,
    required: true,
    index: true
  }],
  year: {
    type: Number,
    required: true,
    index: true
  },
  releaseDate: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  poster: {
    type: String,
    required: true
  },
  backdrop: {
    type: String
  },
  trailer: {
    type: String
  },
  cast: [{
    name: String,
    character: String,
    image: String
  }],
  director: {
    type: String
  },
  streamingUrls: [{
    quality: {
      type: String,
      enum: ['1080p', '720p', '480p', '360p'],
      default: '720p'
    },
    url: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['local', 'telegram', 'external'],
      default: 'local'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  telegramFileId: {
    type: String
  },
  telegramMessageId: {
    type: Number
  },
  imdbId: {
    type: String,
    index: true
  },
  tmdbId: {
    type: Number,
    index: true
  },
  language: {
    type: String,
    default: 'English'
  },
  subtitles: [{
    language: String,
    url: String
  }],
  tags: [{
    type: String,
    index: true
  }],
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isLatest: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
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

// Indexes for better query performance
movieSchema.index({ title: 'text', description: 'text', genre: 'text' });
movieSchema.index({ year: -1, createdAt: -1 });
movieSchema.index({ views: -1 });
movieSchema.index({ isActive: 1, isFeatured: 1 });
movieSchema.index({ isActive: 1, isLatest: 1 });
movieSchema.index({ isActive: 1, isPopular: 1 });

// Virtual for getting primary streaming URL
movieSchema.virtual('primaryStreamingUrl').get(function() {
  const activeUrl = this.streamingUrls.find(url => url.isActive);
  return activeUrl ? activeUrl.url : null;
});

// Method to increment views
movieSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get movies by category
movieSchema.statics.getByCategory = function(category, limit = 20) {
  const query = { isActive: true };
  
  switch(category) {
    case 'latest':
      query.isLatest = true;
      break;
    case 'popular':
      query.isPopular = true;
      break;
    case 'featured':
      query.isFeatured = true;
      break;
    default:
      if (category !== 'all') {
        query.genre = { $in: [category] };
      }
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-streamingUrls');
};

// Static method to search movies
movieSchema.statics.search = function(searchTerm, limit = 20) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { originalTitle: { $regex: searchTerm, $options: 'i' } },
          { genre: { $in: [new RegExp(searchTerm, 'i')] } },
          { cast: { $elemMatch: { name: { $regex: searchTerm, $options: 'i' } } } }
        ]
      }
    ]
  })
  .sort({ views: -1, createdAt: -1 })
  .limit(limit)
  .select('-streamingUrls');
};

// Add pagination plugin
movieSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Movie', movieSchema); 