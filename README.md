# Kani TTS Web UI

A web-based text-to-speech application powered by [Kani TTS](https://github.com/nineninesix-ai/kani-tts), optimized for Apple Silicon.

> This project was generated with [Claude Opus 4.5](https://www.anthropic.com/claude)

## Quick Start

```bash
git clone https://github.com/KalinRangelovRangelov/KaniTTS.git
cd KaniTTS
./setup.sh   # Install dependencies (first time only)
./start.sh   # Start the application
```

Then open http://localhost:5173 in your browser.

**That's it!** Models will download automatically when you click "Download Model" in the UI.

## Requirements

- **Python 3.12** (Python 3.13 has numpy/ml_dtypes compatibility issues)
- Node.js 18+
- macOS with Apple Silicon (M1/M2/M3/M4)

## Disk Space

| Component | Size |
|-----------|------|
| Backend (Python venv) | ~2.7 GB |
| Frontend (node_modules) | ~120 MB |
| English model (kani-tts-400m-en) | ~720 MB |
| German model (kani-tts-370m) | ~1.4 GB |
| **Total (both models)** | **~5 GB** |

## Features

- Multi-language support (English, German)
- Multiple speaker voices per language
- Real-time model download with progress tracking
- Speech history with playback, download, and delete
- Persistent history across sessions
- Optimized for Apple Silicon (CPU inference)
- Works out of the box - no manual configuration needed

## Available Voices

### English (7 voices)
| Voice | Gender |
|-------|--------|
| Jenny | Female |
| Katie | Female |
| Kore | Female |
| David | Male |
| Andrew | Male |
| Simon | Male |
| Puck | Male |

### German (2 voices)
| Voice | Gender |
|-------|--------|
| Thorsten | Male |
| Bert | Male |

## Usage

1. **Download a model** - Click "Download Model" for your preferred language
2. **Load the model** - Click "Load Model" after download completes
3. **Select a speaker** - Choose from available voices
4. **Generate speech** - Enter text and click "Generate Speech"
5. **Manage audio** - Play, download, or delete from history

## Scripts

| Script | Description |
|--------|-------------|
| `./setup.sh` | Install all dependencies (run once) |
| `./start.sh` | Start frontend and backend servers |
| `./stop.sh` | Stop all running services |

## Project Structure

```
KaniTTS/
├── backend/              # FastAPI server
│   ├── main.py           # API endpoints
│   ├── tts_service.py    # TTS generation
│   ├── config.py         # Model & speaker config
│   └── downloader.py     # Model download with SSE progress
├── frontend/             # React + Vite app
│   └── src/
│       ├── App.tsx       # Main application
│       ├── api.ts        # API client
│       └── components/   # UI components
├── models/               # Downloaded TTS models (auto-created)
├── output/               # Generated audio files (auto-created)
├── setup.sh              # Setup script
├── start.sh              # Start script
└── stop.sh               # Stop script
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models` | GET | List all models with status |
| `/api/models/{key}/download` | GET | Download model (SSE stream) |
| `/api/models/{key}/load` | POST | Load model into memory |
| `/api/models/{key}/unload` | POST | Unload model from memory |
| `/api/speakers/{key}` | GET | Get available speakers |
| `/api/tts` | POST | Generate speech |
| `/api/audio/{filename}` | GET | Stream audio file |
| `/api/audio/{filename}` | DELETE | Delete audio file |

## Tech Stack

**Backend:**
- Python 3.12
- FastAPI + Uvicorn
- Kani TTS
- PyTorch (CPU optimized)
- SSE for real-time progress

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS

## Manual Setup

If you prefer manual setup over the scripts:

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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### `module 'ml_dtypes' has no attribute 'float4_e2m1fn'`
Ensure `ml_dtypes>=0.5.0` is installed:
```bash
pip install "ml_dtypes>=0.5.0"
```

### `lfm2` model type not recognized
You need transformers from git (5.0.0.dev0+) for lfm2 support. The setup script installs this automatically.

### numpy version conflicts on Python 3.13
Use Python 3.12 instead. Python 3.13 has incompatible numpy requirements between ml_dtypes and megatron-core.

### Port already in use
Stop any existing services:
```bash
./stop.sh
# Or manually:
pkill -f "python main.py"
pkill -f "vite"
```

## License

MIT
