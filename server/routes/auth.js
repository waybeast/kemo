const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Extended to 30 days for better UX
  );
};

// Register new user
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Display name must be less than 30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || username
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Validate that either username or email is provided
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'Username or email is required'
      });
    }

    // Determine the identifier (email or username)
    const identifier = email || username;

    // Find user by username or email
    // Check if identifier contains @ to determine if it's an email
    const isEmailFormat = identifier.includes('@');
    const user = await User.findOne(
      isEmailFormat
        ? { email: identifier.toLowerCase() }
        : {
            $or: [
              { username: identifier.toLowerCase() },
              { email: identifier.toLowerCase() }
            ]
          }
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Display name must be less than 30 characters'),
  body('preferences.language')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
  body('preferences.quality')
    .optional()
    .isIn(['1080p', '720p', '480p', '360p'])
    .withMessage('Invalid quality setting'),
  body('preferences.autoplay')
    .optional()
    .isBoolean()
    .withMessage('Autoplay must be a boolean'),
  body('preferences.subtitles')
    .optional()
    .isBoolean()
    .withMessage('Subtitles must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { displayName, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (displayName) {
      user.displayName = displayName;
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      data: user.toSafeObject(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Add movie to watchlist
router.post('/watchlist/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    await user.addToWatchlist(movieId);

    res.json({
      success: true,
      message: 'Movie added to watchlist'
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add movie to watchlist'
    });
  }
});

// Remove movie from watchlist
router.delete('/watchlist/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    await user.removeFromWatchlist(movieId);

    res.json({
      success: true,
      message: 'Movie removed from watchlist'
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove movie from watchlist'
    });
  }
});

// Get watchlist
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user.watchlist
    });
  } catch (error) {
    console.error('Watchlist fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist'
    });
  }
});

// Add to watch history with progress tracking
router.post('/history/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { progress = 0, duration = 0, lastPosition = 0 } = req.body;
    const user = await User.findById(req.user._id);

    await user.addToHistory(movieId, progress, duration, lastPosition);

    res.json({
      success: true,
      message: 'Watch history updated'
    });
  } catch (error) {
    console.error('Watch history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update watch history'
    });
  }
});

// Get watch history
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user.watchHistory
    });
  } catch (error) {
    console.error('Watch history fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watch history'
    });
  }
});

// Get watch progress for a specific movie
router.get('/progress/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    const progress = user.getWatchProgress(movieId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Watch progress fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watch progress'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

// Verify token
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
        valid: true
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router; 