# Deploy to Railway - Quick Guide

## Prerequisites
- GitHub account
- Railway account (free)
- MongoDB Atlas account (free)

## Step 1: Prepare Your Code

### 1.1 Create railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Add start:prod script to package.json
```json
{
  "scripts": {
    "start:prod": "cd server && npm start & cd client && npm start"
  }
}
```

### 1.3 Create .railwayignore
```
node_modules/
.git/
.env
*.log
```

## Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0)
4. Create database user
5. Whitelist all IPs (0.0.0.0/0)
6. Get connection string
7. Save it for later

## Step 3: Deploy to Railway

### Option A: Using Railway CLI

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link to GitHub (optional)
railway link

# 5. Add environment variables
railway variables set MONGODB_URI="your_mongodb_uri"
railway variables set JWT_SECRET="your_secret"
railway variables set TMDB_API_KEY="your_tmdb_key"

# 6. Deploy
railway up

# 7. Get your URL
railway domain
```

### Option B: Using Railway Dashboard

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your repository
6. Railway auto-detects and configures
7. Add environment variables in Settings
8. Deploy!

## Step 4: Configure Environment Variables

In Railway dashboard, add these variables:

### Backend Variables:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kemo
JWT_SECRET=your_super_secret_key_here
TMDB_API_KEY=your_tmdb_api_key
PORT=5000
NODE_ENV=production
```

### Frontend Variables:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## Step 5: Update CORS Settings

In `server/index.js`, update CORS:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.railway.app'
  ],
  credentials: true
}));
```

## Step 6: Test Deployment

1. Railway provides a URL: `https://your-app.railway.app`
2. Open in browser
3. Test video playback
4. Check if VidKing works now!

## Troubleshooting

### Build Fails
- Check Railway logs
- Ensure all dependencies in package.json
- Check Node version compatibility

### Backend Not Connecting
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist
- Verify environment variables are set

### Frontend Can't Reach Backend
- Check REACT_APP_API_URL is correct
- Verify CORS settings
- Check backend is running

## Cost

- **Free tier**: $5 credit per month
- **After free tier**: ~$5-10/month
- **MongoDB Atlas**: FREE (M0 cluster)

## Next Steps

After deployment:
1. Test video playback
2. Check all features work
3. Monitor Railway logs
4. Set up custom domain (optional)
5. Enable analytics
6. Soft launch!

---

## Quick Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open

# Add variable
railway variables set KEY=value

# Get domain
railway domain

# Restart
railway restart
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
