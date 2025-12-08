#!/bin/bash

echo "Setting up Kani TTS..."

# Backend setup
echo "Setting up backend..."
cd backend

# Use Python 3.12 (Python 3.13 has numpy/ml_dtypes compatibility issues)
if command -v python3.12 &> /dev/null; then
    echo "Using Python 3.12..."
    python3.12 -m venv venv
else
    echo "Python 3.12 not found, using default python3..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Setup complete! Run ./start.sh to start the application."
