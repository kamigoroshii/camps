#!/bin/bash

echo "================================"
echo "Scholarship Verification Module"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    exit 1
fi

echo "Starting Backend Server..."
echo ""

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "================================"
echo "Server starting on port 8001"
echo "================================"
echo ""
echo "Open the following in your browser:"
echo "  - API Docs: http://localhost:8001/docs"
echo "  - Frontend: ../frontend/index.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python main.py
