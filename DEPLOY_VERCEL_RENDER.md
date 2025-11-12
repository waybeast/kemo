# Deploy to Vercel + Render - Complete Guide

## 🎯 Overview

- **Frontend**: Vercel (FREE)
- **Backend**: Render (FREE)
- **Database**: MongoDB Atlas (FREE)

Total Cost: **$0/month** ✅

---

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (vercel.com)
3. ✅ Render account (render.com)
4. ✅ MongoDB Atlas account (mongodb.com/cloud/atlas)
5. ✅ TMDb API key (themoviedb.org)

---

## Part 1: Set Up MongoDB Atlas (5 minutes)

### Step 1: Create Free Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Click "Build a Database"
4. Choose **FREE** tier (M0)
5. Select region closest to you
6. Click "Create Cluster"

### Step 2: Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `kemo_user`
5. Password: Generate strong password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 3: Whitelist All IPs

1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. IP: `0.0.0.0/0`
5. Click "Confirm"

### Step 4: Get Connection String

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `kemo`

Example:
```
mongodb+srv://kemo_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/kemo?retryWrites=true&w=majority
```

**Save this connection string!** You'll need it later.

---

## Part 2: Deploy Backend to Render (10 minutes)

### Step 1: Prepare Backend for Deployment

Create `server/package.json` if it doesn't exist:

```json
{
  "name": "kemo-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "axios": "^1.5.0",
    "redis": "^4.6.0",
    "node-cron": "^3.0.2"
  }
}
```

### Step 2: Create render.yaml (Optional but Recommended)

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: kemo-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
```

### Step 3: Deploy to Render

1. Go to https://render.com
2. Sign up / Log in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `kemo-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your branch)
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: FREE

### Step 4: Add Environment Variables

In Render dashboard, go to "Environment" and add:

```
MONGODB_URI=mongodb+srv://kemo_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/kemo
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
TMDB_API_KEY=your_tmdb_api_key_here
PORT=5000
NODE_ENV=production
REDIS_URL=
```

**Important**: Leave `REDIS_URL` empty (Redis is optional)

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://kemo-backend.onrender.com`
4. **Save this URL!** You'll need it for frontend

### Step 6: Test Backend

Open: `https://kemo-backend.onrender.com/api/health`

Should return:
```json
{
  "status": "OK",
  "checks": {
    "database": "healthy"
  }
}
```

---

## Part 3: Deploy Frontend to Vercel (5 minutes)

### Step 1: Prepare Frontend

Update `client/package.json` - remove proxy:

```json
{
  "name": "kemo-client",
  "version": "1.0.0",
  "private": true,
  // ... other fields ...
  // REMOVE THIS LINE:
  // "proxy": "http://localhost:5000"
}
```

### Step 2: Create vercel.json

Create `vercel.json` in `client/` folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Step 3: Update API Base URL

Create `client/.env.production`:

```env
REACT_APP_API_URL=https://kemo-backend.onrender.com
```

### Step 4: Update Axios Configuration

Check if you have `client/src/utils/api.js` or similar. Update base URL:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true
});

export default api;
```

If you don't have this file, create it and update all API calls to use it.

### Step 5: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client folder
cd client

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? kemo-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://kemo-backend.onrender.com`
7. Click "Deploy"

### Step 6: Get Your URL

After deployment, Vercel gives you a URL like:
```
https://kemo-frontend.vercel.app
```

---

## Part 4: Update CORS Settings

### Update Backend CORS

Edit `server/index.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://kemo-frontend.vercel.app', // Your Vercel URL
    'https://kemo-frontend-*.vercel.app' // Preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Commit and Push

```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will auto-deploy the update.

---

## Part 5: Populate Database with Movies

### Option 1: Using Local Script

```bash
# Run locally with production MongoDB
MONGODB_URI="your_atlas_uri" node server/scripts/populateMovies.js
```

### Option 2: Using Render Shell

1. Go to Render dashboard
2. Click on your service
3. Go to "Shell" tab
4. Run:
```bash
node scripts/populateMovies.js
```

---

## Part 6: Test Everything

### 1. Test Backend
```
https://kemo-backend.onrender.com/api/health
https://kemo-backend.onrender.com/api/movies?limit=5
```

### 2. Test Frontend
```
https://kemo-frontend.vercel.app
```

### 3. Test Video Playback
1. Open frontend URL
2. Login / Register
3. Click a movie
4. Try to play
5. **VidKing should work now!** (not blocked by localhost)

---

## 🎯 Final Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string saved
- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Backend health check passing
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set (REACT_APP_API_URL)
- [ ] CORS updated with Vercel URL
- [ ] Database populated with movies
- [ ] Video playback tested

---

## 🐛 Troubleshooting

### Backend Issues

**Build fails on Render:**
- Check `server/package.json` exists
- Verify all dependencies are listed
- Check Node version compatibility

**Database connection fails:**
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

**API returns 500 errors:**
- Check Render logs
- Verify environment variables
- Check MongoDB connection

### Frontend Issues

**Build fails on Vercel:**
- Check `client/package.json`
- Verify all dependencies installed
- Check for syntax errors

**API calls fail:**
- Verify REACT_APP_API_URL is correct
- Check CORS settings on backend
- Open browser console for errors

**Movies don't load:**
- Check backend is running
- Verify database has movies
- Check API endpoint in Network tab

### Video Playback Issues

**VidKing still doesn't work:**
- Try different movies
- Check browser console for errors
- Verify VidKing URL is accessible
- Try disabling ad blocker

---

## 📊 Monitoring

### Render Dashboard
- View logs
- Monitor CPU/Memory
- Check deployment status

### Vercel Dashboard
- View deployment logs
- Monitor bandwidth
- Check build status

### MongoDB Atlas
- Monitor database size
- Check connection count
- View slow queries

---

## 🚀 Next Steps

After successful deployment:

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Enable analytics
4. ✅ Set up error tracking (Sentry)
5. ✅ Configure CDN for assets
6. ✅ Soft launch with beta users
7. ✅ Monitor performance
8. ✅ Gather feedback

---

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | FREE |
| Render | Free | FREE |
| MongoDB Atlas | M0 | FREE |
| **Total** | | **$0/month** |

### Limits (Free Tier):
- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month, sleeps after 15min inactivity
- **MongoDB**: 512MB storage, shared RAM

---

## 🎉 You're Done!

Your streaming platform is now live at:
- **Frontend**: https://kemo-frontend.vercel.app
- **Backend**: https://kemo-backend.onrender.com

Share the frontend URL and start testing!

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

Need help? Check the logs first, then reach out!
