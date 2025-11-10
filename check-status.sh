#!/bin/bash

echo "🔍 Kemo Streaming Platform - Status Check"
echo "=========================================="
echo ""

# Check Node.js
echo "📦 Node.js:"
node --version 2>/dev/null && echo "   ✅ Installed" || echo "   ❌ Not installed"
echo ""

# Check MongoDB
echo "🗄️  MongoDB:"
mongod --version 2>/dev/null | head -1 && echo "   ✅ Installed" || echo "   ❌ Not installed"
pgrep -x mongod > /dev/null && echo "   ✅ Running" || echo "   ⚠️  Not running"
echo ""

# Check Backend Server
echo "🖥️  Backend Server (Port 5000):"
if ss -tlnp 2>/dev/null | grep -q ":5000"; then
    echo "   ✅ Running"
    curl -s http://localhost:5000/api/movies?limit=1 > /dev/null && echo "   ✅ API responding" || echo "   ⚠️  API not responding"
else
    echo "   ❌ Not running"
fi
echo ""

# Check Frontend Server
echo "🌐 Frontend Server (Port 3000):"
if ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✅ Running"
else
    echo "   ❌ Not running"
fi
echo ""

# Check Database
echo "📊 Database:"
if pgrep -x mongod > /dev/null; then
    MOVIE_COUNT=$(mongosh kemo --quiet --eval "db.movies.countDocuments()" 2>/dev/null)
    if [ ! -z "$MOVIE_COUNT" ]; then
        echo "   ✅ Connected"
        echo "   📽️  Movies in database: $MOVIE_COUNT"
    else
        echo "   ⚠️  Cannot connect"
    fi
else
    echo "   ❌ MongoDB not running"
fi
echo ""

# Check Environment
echo "🔐 Environment Configuration:"
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    grep -q "TMDB_API_KEY=.\+" .env && echo "   ✅ TMDb API key configured" || echo "   ⚠️  TMDb API key not set"
    grep -q "VIDKING_API_KEY=.\+" .env && echo "   ✅ VidKing API key configured" || echo "   ⚠️  VidKing API key not set"
    grep -q "JWT_SECRET=.\+" .env && echo "   ✅ JWT secret configured" || echo "   ⚠️  JWT secret not set"
else
    echo "   ❌ .env file not found"
fi
echo ""

# URLs
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api/movies"
echo ""

# Quick Actions
echo "⚡ Quick Actions:"
echo "   Start servers:  ./restart-servers.sh"
echo "   Stop servers:   lsof -ti:5000,3000 | xargs kill -9"
echo "   Add movies:     node server/scripts/populateMovies.js"
echo "   View logs:      tail -f logs/app.log"
echo ""

echo "=========================================="
