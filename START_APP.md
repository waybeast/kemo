# 🚀 Kemo Streaming Platform - Startup Guide

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js (v14 or higher)
- ✅ MongoDB running (local or Atlas)
- ✅ npm or yarn installed

---

## 📋 Step-by-Step Startup Instructions

### Step 1: Clean Everything (Fresh Start)

```bash
# Kill any running processes
pkill -9 -f "node.*5000"
pkill -9 -f "react-scripts"

# Clean caches
rm -rf client/build
rm -rf client/node_modules/.cache
rm -rf client/.cache
rm -rf server/node_modules/.cache

echo "✅ Cleaned all caches and killed processes"
```

### Step 2: Install Dependencies (If Needed)

```bash
# Install backend dependencies
cd server
npm install
cd ..

# Install frontend dependencies
cd client
npm install
cd ..

echo "✅ Dependencies installed"
```

### Step 3: Check Environment Variables

Make sure your `.env` file in the root directory has:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_secret_key_here

# TMDb API
TMDB_API_KEY=your_tmdb_api_key

# Redis (optional - will work without it)
REDIS_URL=redis://localhost:6379

# Server Port
PORT=5000
```

### Step 4: Start Backend Server

Open a **NEW TERMINAL** and run:

```bash
cd server
npm start
```

**Expected Output:**
```
VidKing Service initialized: { enabled: true, hasApiKey: false, baseUrl: 'https://www.vidking.net' }
EnhancedStreamingService initialized with VidKing as primary provider
SessionManager initialized
Server running on port 5000
Connected to MongoDB
```

**✅ Backend is ready when you see:** `Server running on port 5000`

### Step 5: Start Frontend Development Server

Open **ANOTHER NEW TERMINAL** and run:

```bash
cd client
npm start
```

**Expected Output:**
```
Starting the development server...
Compiled successfully!

You can now view kemo-client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.7:3000
```

**✅ Frontend is ready when you see:** `Compiled successfully!`

### Step 6: Clear Browser Cache

**IMPORTANT:** Before opening the app, clear your browser cache:

#### Option A: Hard Reload (Recommended)
1. Open browser
2. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

#### Option B: Clear All Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

#### Option C: Use Incognito Mode (Best for Testing)
1. Press `Ctrl + Shift + N` (Windows/Linux) or `Cmd + Shift + N` (Mac)
2. Go to http://localhost:3000

### Step 7: Open the Application

Open your browser and go to:
```
http://localhost:3000
```

---

## 🔍 Verification Checklist

### Backend Health Check

Open a new terminal and run:
```bash
curl http://localhost:5000/api/movies/category/latest?limit=1
```

**Expected:** JSON response with movie data

### Frontend Health Check

1. Open http://localhost:3000
2. You should see the home page with movies
3. Check browser console (F12) - no red errors

### Streaming Health Check

```bash
curl http://localhost:5000/api/streaming/sources/278
```

**Expected:** JSON with VidKing streaming source

---

## 🐛 Troubleshooting

### Problem: "Port 5000 already in use"

```bash
# Kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use:
pkill -9 -f "node.*5000"
```

### Problem: "Port 3000 already in use"

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use:
pkill -9 -f "react-scripts"
```

### Problem: "Cannot connect to MongoDB"

Check your MongoDB connection:
```bash
# If using local MongoDB
sudo systemctl status mongod

# If using MongoDB Atlas
# Make sure your IP is whitelisted in Atlas
```

### Problem: "Old code still loading / Hydrogen errors"

This is a browser caching issue:

1. **Stop both servers** (Ctrl+C in both terminals)
2. **Clear caches:**
   ```bash
   rm -rf client/build client/node_modules/.cache
   ```
3. **Restart frontend:**
   ```bash
   cd client
   npm start
   ```
4. **Clear browser cache completely:**
   - Press `Ctrl + Shift + Delete`
   - Select ALL options
   - Click "Clear data"
5. **Close browser completely**
6. **Reopen in Incognito mode**

### Problem: "Module not found" errors

```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Quick Status Check Script

Create a file `check-status.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Kemo Application Status..."
echo ""

# Check backend
if curl -s http://localhost:5000/api/movies/category/latest?limit=1 > /dev/null; then
    echo "✅ Backend is running on port 5000"
else
    echo "❌ Backend is NOT running"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend is NOT running"
fi

# Check MongoDB
if curl -s http://localhost:5000/api/movies/category/latest?limit=1 | grep -q "success"; then
    echo "✅ MongoDB is connected"
else
    echo "❌ MongoDB connection issue"
fi

# Check streaming
if curl -s http://localhost:5000/api/streaming/sources/278 | grep -q "vidking"; then
    echo "✅ Streaming service is working"
else
    echo "❌ Streaming service issue"
fi

echo ""
echo "📊 Status check complete!"
```

Run it:
```bash
chmod +x check-status.sh
./check-status.sh
```

---

## 🎯 Quick Start (One Command)

Create a file `start-all.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Kemo Application..."

# Clean caches
echo "🧹 Cleaning caches..."
rm -rf client/build client/node_modules/.cache server/node_modules/.cache

# Kill existing processes
echo "🔪 Killing existing processes..."
pkill -9 -f "node.*5000" 2>/dev/null
pkill -9 -f "react-scripts" 2>/dev/null

# Start backend in background
echo "🔧 Starting backend..."
cd server
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend in background
echo "🎨 Starting frontend..."
cd client
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application started!"
echo "📝 Backend PID: $BACKEND_PID (logs: backend.log)"
echo "📝 Frontend PID: $FRONTEND_PID (logs: frontend.log)"
echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo "🔍 Check logs with: tail -f backend.log frontend.log"
echo ""
echo "To stop: pkill -9 -f 'node.*5000' && pkill -9 -f 'react-scripts'"
```

Run it:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 📝 Development Workflow

### Daily Startup
1. Open 2 terminals
2. Terminal 1: `cd server && npm start`
3. Terminal 2: `cd client && npm start`
4. Open http://localhost:3000

### After Pulling New Code
1. Stop both servers (Ctrl+C)
2. `cd server && npm install`
3. `cd client && npm install`
4. Clear browser cache
5. Restart both servers

### Before Committing
1. Test authentication (login/register)
2. Test movie browsing
3. Test video playback
4. Check console for errors

---

## 🎬 Testing the Application

### 1. Test Authentication
- Go to http://localhost:3000/register
- Create account: username, email, password
- Login with credentials
- Check if profile shows in navbar

### 2. Test Movie Browsing
- Home page should show movie carousels
- Click on a movie card
- Movie detail page should load

### 3. Test Video Playback
- On movie detail page, click "Watch Now"
- Should navigate to `/watch/{movieId}`
- Video player should load
- VidKing embed should appear

### 4. Check Console Logs
Open browser console (F12) and look for:
```
🔍 SourceManager: Loading sources for movie 278
✅ SourceManager: Received data
📺 SourceManager: Found 1 sources
🎯 SourceManager: Auto-selecting source vidking
📥 MoviePlayer: Received sources
```

---

## 🆘 Need Help?

If you're still having issues:

1. **Check both terminal outputs** for error messages
2. **Check browser console** (F12) for frontend errors
3. **Run the status check script** to see what's working
4. **Try Incognito mode** to rule out caching issues
5. **Check the logs:** `tail -f backend.log frontend.log`

---

**Last Updated:** November 11, 2025
**Status:** Ready for development
