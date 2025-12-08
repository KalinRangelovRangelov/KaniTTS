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

# Install transformers from git (after main deps to avoid conflicts)
# Required for lfm2 model architecture support
echo "Installing transformers from git for lfm2 support..."
pip install --no-deps git+https://github.com/huggingface/transformers.git
pip install "tokenizers>=0.22.0" "huggingface-hub>=1.0.0" typer-slim
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Setup complete! Run ./start.sh to start the application."
