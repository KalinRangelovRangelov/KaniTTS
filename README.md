# Kani TTS Web UI

A web-based text-to-speech application powered by [Kani TTS](https://github.com/nineninesix-ai/kani-tts), optimized for Apple Silicon.

> This project was generated with [Claude Opus 4.5](https://www.anthropic.com/claude)

## Features

- Multi-language support (English, German)
- Multiple speaker voices per language
- Speech history with playback, download, and delete
- Model download with progress tracking
- Persistent history across sessions

## Project Structure

```
KaniTTS/
├── backend/          # FastAPI server
│   ├── main.py       # API endpoints
│   ├── tts_service.py # TTS generation
│   ├── config.py     # Model & speaker config
│   └── downloader.py # Model download handling
├── frontend/         # React + Vite app
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       └── components/
├── models/           # Downloaded TTS models
└── output/           # Generated audio files
```

## Quick Start

```bash
./setup.sh   # Install dependencies (first time only)
./start.sh   # Start both frontend and backend
./stop.sh    # Stop all services
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models` | GET | List all models |
| `/api/models/{key}/download` | GET | Download model (SSE) |
| `/api/models/{key}/load` | POST | Load model into memory |
| `/api/speakers/{key}` | GET | Get speakers for model |
| `/api/tts` | POST | Generate speech |
| `/api/audio/{filename}` | GET | Get audio file |
| `/api/audio/{filename}` | DELETE | Delete audio file |

## Available Speakers

### English (kani-tts-400m-en)
- Jenny (female)
- Katie (female)
- Kore (female)
- David (male)
- Andrew (male)
- Simon (male)
- Puck (male)

### German (kani-tts-370m multilingual)
- Thorsten (male)
- Bert (male)

## Usage

1. Select a language model and download if needed
2. Load the model into memory
3. Choose a speaker voice
4. Enter text and click "Generate Speech"
5. Play, download, or manage generated audio in the history

## Tech Stack

- **Backend**: Python, FastAPI, Kani TTS, PyTorch
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
