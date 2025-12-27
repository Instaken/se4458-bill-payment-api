#!/bin/bash

# SE 4458 - Bill Payment AI Agent - Development Script
# This script helps start both backend and frontend servers

echo "🚀 Starting SE 4458 Bill Payment AI Agent..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env file with:"
    echo "  - GEMINI_API_KEY"
    echo "  - GOOGLE_APPLICATION_CREDENTIALS"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

echo ""
echo "✅ Starting servers..."
echo ""
echo "📡 Backend will run on: http://localhost:8080"
echo "🎨 Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
