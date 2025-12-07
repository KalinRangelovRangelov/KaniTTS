#!/bin/bash

echo "Stopping Kani TTS..."

# Kill backend (uvicorn/python on port 8000)
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "Backend stopped" || echo "Backend not running"

# Kill frontend (vite on port 5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "Frontend stopped" || echo "Frontend not running"

echo "Done."
