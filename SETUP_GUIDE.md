# Kemo Streaming Platform - Setup Guide

## ✅ Current Status

Your application is **RUNNING** and ready for testing!

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Database**: MongoDB (29 movies loaded)

## 🎯 Quick Access

### Open in Browser
```
http://localhost:3000
```

### Test API
```bash
curl http://localhost:5000/api/movies?limit=5
```

## 📋 What's Already Set Up

✅ Node.js v22.20.0
✅ MongoDB v7.0.25 (running)
✅ Backend server (port 5000)
✅ Frontend React app (port 3000)
✅ 29 movies in database
✅ TMDb API integration
✅ VidKing API service (ready to enable)

## 🔧 Environment Configuration

Your `.env` file is configured with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kemo

# APIs
TMDB_API_KEY=configured ✅
VIDKING_API_KEY=not set (optional)
VIDKING_ENABLED=false

# Security
JWT_SECRET=configured ✅
CORS_ORIGIN=http://localhost:3000
```

## 🚀 How to Start/Stop Servers

### Start Both Servers
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client && npm start
```

### Or Use the Restart Script
```bash
./restart-servers.sh
```

### Stop Servers
```bash
# Find and kill processes
lsof -ti:5000,3000 | xargs kill -9
```

## 🎬 Testing the Application

### 1. Browse Movies
- Open http://localhost:3000
- You should see 29 movies loaded from TMDb

### 2. Search Movies
- Use the search bar
- Filter by genre, year, rating

### 3. View Movie Details
- Click on any movie card
- See full details, cast, and synopsis

### 4. Test Video Player
- Click "Play" on a movie
- Video player should open (streaming sources may vary)

### 5. User Authentication
- Register a new account
- Login
- Add movies to watchlist

## 📊 Database Management

### View Movies in Database
```bash
mongosh kemo --eval "db.movies.countDocuments()"
```

### Add More Movies
```bash
node server/scripts/populateMovies.js
```

### Clear Database
```bash
mongosh kemo --eval "db.movies.deleteMany({})"
```

## 🔑 API Keys Setup

### TMDb API (Already Configured)
✅ Your TMDb API key is working

### VidKing API (Optional - For Better Streaming)
1. Get API key from https://www.vidking.net
2. Update `.env`:
   ```env
   VIDKING_API_KEY=your_key_here
   VIDKING_ENABLED=true
   ```
3. Restart backend server

### Telegram Integration (Optional)
1. Create bot with @BotFather
2. Get bot token
3. Update `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_CHANNEL_ID=your_channel_id
   ```

## 🧪 Testing Endpoints

### Movies API
```bash
# Get all movies
curl http://localhost:5000/api/movies

# Get movie by ID
curl http://localhost:5000/api/movies/MOVIE_ID

# Search movies
curl "http://localhost:5000/api/movies/search?q=inception"

# Get by category
curl http://localhost:5000/api/movies/category/popular
```

### Authentication API
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Streaming API
```bash
# Get streaming sources
curl http://localhost:5000/api/streaming/sources/MOVIE_ID
```

### TMDb Integration
```bash
# Get popular movies from TMDb
curl http://localhost:5000/api/tmdb/popular

# Search TMDb
curl "http://localhost:5000/api/tmdb/search?q=inception"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 5000 and 3000
lsof -ti:5000,3000 | xargs kill -9

# Then restart servers
npm run server
cd client && npm start
```

### MongoDB Not Running
```bash
# Start MongoDB
sudo systemctl start mongod

# Or if using manual installation
mongod --dbpath /path/to/data
```

### Frontend Won't Compile
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend Errors
```bash
# Check logs
tail -f logs/app.log

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run server
```

## 📦 Project Structure

```
kemo/
├── server/                 # Backend
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   │   ├── vidkingService.js    # VidKing API (Task 4 ✅)
│   │   ├── tmdbService.js       # TMDb integration
│   │   ├── streamingService.js  # Streaming sources
│   │   └── cacheService.js      # Redis caching
│   ├── middleware/        # Auth, cache, metrics
│   └── scripts/           # Database population
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js
│   └── public/
└── .env                   # Environment variables
```

## 🎯 Next Development Tasks

Based on your spec, here are the remaining tasks:

- ⏳ Task 5: Enhanced Streaming Service with fallback
- ⏳ Task 6: Update streaming routes to use VidKing
- ⏳ Task 7: Rate limiting enhancements
- ⏳ Task 8: Circuit breaker pattern
- ⏳ Task 9: Session management
- ⏳ Task 10: Deployment configuration

## 🌐 Deployment Options

### Quick Deploy (Free Tier)

**Backend:**
- Railway.app
- Render.com
- Fly.io

**Frontend:**
- Vercel
- Netlify
- Cloudflare Pages

**Database:**
- MongoDB Atlas (free tier)

## 📝 Notes

- Your `.env` file is NOT in git (protected by .gitignore)
- TMDb API key is working
- VidKing service is implemented but not enabled
- Redis is optional (caching will work without it)
- All test scripts are in the root directory

## 🆘 Need Help?

- Check the logs: `tail -f logs/app.log`
- Test API: `curl http://localhost:5000/api/movies`
- Check processes: `ps aux | grep node`
- Check ports: `ss -tlnp | grep -E ":5000|:3000"`

---

**Everything is set up and running! Open http://localhost:3000 to start testing.**
