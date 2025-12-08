# Kani TTS Web UI

A web-based text-to-speech application powered by [Kani TTS](https://github.com/nineninesix-ai/kani-tts), optimized for Apple Silicon.

> This project was generated with [Claude Opus 4.5](https://www.anthropic.com/claude)

## Requirements

- **Python 3.12** (Python 3.13 has numpy/ml_dtypes compatibility issues)
- Node.js 18+
- macOS with Apple Silicon (M1/M2/M3) recommended

## Features

- Multi-language support (English, German)
- Multiple speaker voices per language
- Speech history with playback, download, and delete
- Model download with progress tracking
- Persistent history across sessions
- Optimized for Apple Silicon (CPU inference)

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
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install transformers from git (required for lfm2 model architecture)
pip install --no-deps git+https://github.com/huggingface/transformers.git
pip install "tokenizers>=0.22.0" "huggingface-hub>=1.0.0" typer-slim

python main.py
```

> **Note**: The `setup.sh` script handles all of this automatically.

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

- **Backend**: Python 3.12, FastAPI, Kani TTS, PyTorch
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS

## Troubleshooting

### `module 'ml_dtypes' has no attribute 'float4_e2m1fn'`
Ensure `ml_dtypes>=0.5.0` is installed. Run `pip install "ml_dtypes>=0.5.0"`.

### `lfm2` model type not recognized
You need transformers from git (5.0.0.dev0+) for lfm2 support. The setup script installs this automatically.

### numpy version conflicts on Python 3.13
Use Python 3.12 instead. Python 3.13 has incompatible numpy requirements between ml_dtypes and megatron-core.
