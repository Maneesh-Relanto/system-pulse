#!/bin/bash
# Quick Start Script for System Pulse

echo "======================================"
echo "System Pulse - Quick Start"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python found"
echo ""

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip not found. Please install pip"
    exit 1
fi

echo "✓ pip found"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Initialize logos
echo "Downloading and caching app logos (this may take a minute)..."
python init_logos.py

if [ $? -ne 0 ]; then
    echo "⚠ Warning: Logo initialization had issues"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Start the server with:"
echo "  python -m uvicorn main:app --reload"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:8000"
echo ""
echo "======================================"
