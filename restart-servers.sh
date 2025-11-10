#!/bin/bash

echo "🔄 Restarting Kemo Servers..."

# Kill existing processes
echo "📴 Stopping existing servers..."
pkill -f "node.*server" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null
sleep 2

# Start backend
echo "🚀 Starting backend server..."
npm run server &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd client && npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test servers
echo "🧪 Testing servers..."
echo "Backend: $(curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo 'FAILED')"
echo "Frontend: $(curl -s http://localhost:3000 | grep -o '<title>.*</title>' 2>/dev/null || echo 'FAILED')"

echo ""
echo "✅ Servers restarted successfully!"
echo "🌐 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📋 To stop servers: Ctrl+C or run 'pkill -f \"node.*server\" && pkill -f \"npm.*start\"'"
echo ""

# Keep script running to maintain background processes
wait 