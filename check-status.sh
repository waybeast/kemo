#!/bin/bash

echo "==================================="
echo "   Kemo Streaming - Status Check"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check .env file
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check required variables
    if grep -q "TMDB_API_KEY=" .env && ! grep -q "TMDB_API_KEY=$" .env; then
        echo -e "${GREEN}✓${NC} TMDB_API_KEY is set"
    else
        echo -e "${RED}✗${NC} TMDB_API_KEY is missing or empty"
    fi
    
    if grep -q "MONGODB_URI=" .env && ! grep -q "MONGODB_URI=$" .env; then
        echo -e "${GREEN}✓${NC} MONGODB_URI is set"
    else
        echo -e "${RED}✗${NC} MONGODB_URI is missing or empty"
    fi
    
    if grep -q "JWT_SECRET=" .env && ! grep -q "JWT_SECRET=$" .env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "${RED}✗${NC} JWT_SECRET is missing or empty"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# Check MongoDB
echo "2. Checking MongoDB..."
if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
elif docker ps | grep -q mongo; then
    echo -e "${GREEN}✓${NC} MongoDB container is running"
else
    echo -e "${RED}✗${NC} MongoDB is not running"
    echo -e "${YELLOW}  Run: docker run -d -p 27017:27017 --name mongodb mongo:latest${NC}"
fi
echo ""

# Check Redis (optional)
echo "3. Checking Redis (optional)..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is running"
elif docker ps | grep -q redis; then
    echo -e "${GREEN}✓${NC} Redis container is running"
else
    echo -e "${YELLOW}⚠${NC} Redis is not running (optional, but recommended)"
    echo -e "${YELLOW}  Run: docker run -d -p 6379:6379 --name redis redis:latest${NC}"
fi
echo ""

# Check Backend
echo "4. Checking Backend (port 5000)..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running"
    HEALTH=$(curl -s http://localhost:5000/api/health)
    echo "  Response: $HEALTH"
else
    echo -e "${RED}✗${NC} Backend is not running"
    echo -e "${YELLOW}  Run: npm run dev${NC}"
fi
echo ""

# Check Frontend
echo "5. Checking Frontend (port 3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${RED}✗${NC} Frontend is not running"
    echo -e "${YELLOW}  Run: cd client && npm start${NC}"
fi
echo ""

# Check TMDb API
echo "6. Checking TMDb API..."
if [ -f .env ]; then
    TMDB_KEY=$(grep TMDB_API_KEY .env | cut -d '=' -f2)
    if [ ! -z "$TMDB_KEY" ]; then
        RESPONSE=$(curl -s "https://api.themoviedb.org/3/movie/popular?api_key=$TMDB_KEY&page=1")
        if echo "$RESPONSE" | grep -q "results"; then
            echo -e "${GREEN}✓${NC} TMDb API is working"
            MOVIE_COUNT=$(echo "$RESPONSE" | grep -o "\"id\":" | wc -l)
            echo "  Found $MOVIE_COUNT movies"
        else
            echo -e "${RED}✗${NC} TMDb API error"
            echo "  Response: $RESPONSE"
        fi
    else
        echo -e "${RED}✗${NC} TMDB_API_KEY not set"
    fi
else
    echo -e "${RED}✗${NC} Cannot check - .env file missing"
fi
echo ""

# Check Node modules
echo "7. Checking Dependencies..."
if [ -d node_modules ]; then
    echo -e "${GREEN}✓${NC} Backend node_modules exists"
else
    echo -e "${RED}✗${NC} Backend node_modules missing"
    echo -e "${YELLOW}  Run: npm install${NC}"
fi

if [ -d client/node_modules ]; then
    echo -e "${GREEN}✓${NC} Frontend node_modules exists"
else
    echo -e "${RED}✗${NC} Frontend node_modules missing"
    echo -e "${YELLOW}  Run: cd client && npm install${NC}"
fi
echo ""

# Summary
echo "==================================="
echo "           SUMMARY"
echo "==================================="
echo ""
echo "To start the application:"
echo "1. Make sure MongoDB is running"
echo "2. Run: npm run dev (backend)"
echo "3. Run: cd client && npm start (frontend)"
echo "4. Open: http://localhost:3000"
echo ""
echo "For detailed troubleshooting, see TROUBLESHOOTING.md"
echo ""
