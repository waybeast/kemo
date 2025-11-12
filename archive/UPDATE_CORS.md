# Update CORS Configuration

## Step 1: Get Your URLs

After deployment, you should have:
- **Render Backend**: `https://your-app.onrender.com`
- **Vercel Frontend**: `https://your-app.vercel.app`

## Step 2: Update server/index.js

Find this line (around line 77):
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

Replace with:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Replace with your actual Vercel URL
    'https://your-app-*.vercel.app' // For preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Step 3: Add Environment Variable to Render

In Render dashboard:
1. Go to your service
2. Click "Environment"
3. Add new variable:
   - **Key**: `CLIENT_URL`
   - **Value**: `https://your-app.vercel.app`
4. Save

## Step 4: Commit and Push

```bash
git add server/index.js
git commit -m "Update CORS for production deployment"
git push origin main
```

Render will automatically redeploy with the new CORS settings.

## Step 5: Verify

Test the connection:
```bash
curl -I https://your-backend.onrender.com/api/health \
  -H "Origin: https://your-frontend.vercel.app"
```

Should return headers including:
```
Access-Control-Allow-Origin: https://your-frontend.vercel.app
```

---

## Quick Fix Script

Once you have your URLs, I can update the code for you. Just provide:
1. Render backend URL
2. Vercel frontend URL
