import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from config import MODELS, OUTPUT_DIR, SPEAKERS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from downloader import (
    download_model_with_progress,
    get_all_models_status,
    get_model_status,
    is_model_downloaded,
)
from tts_service import tts_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("Kani TTS Backend starting...")
    print(f"Available models: {list(MODELS.keys())}")
    yield
    print("Kani TTS Backend shutting down...")


app = FastAPI(
    title="Kani TTS API",
    description="Text-to-Speech API powered by Kani TTS with Apple Silicon support",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    model: str = Field(default="en", description="Model key (en or de)")
    speaker: str | None = Field(default=None, description="Speaker ID (optional)")
    temperature: float = Field(default=0.7, ge=0.1, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.1, le=1.0, description="Top-p sampling")


class TTSResponse(BaseModel):
    success: bool
    filename: str
    audio_url: str
    text: str
    model: str


class ModelStatus(BaseModel):
    key: str
    name: str
    repo_id: str
    downloaded: bool
    loaded: bool


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Kani TTS API"}


@app.get("/api/models")
async def list_models():
    """Get status of all available models."""
    statuses = get_all_models_status()

    models = []
    for key, status in statuses.items():
        models.append({
            **status,
            "loaded": tts_service.is_model_loaded(key),
        })

    return {"models": models}


@app.get("/api/models/{model_key}")
async def get_model(model_key: str):
    """Get status of a specific model."""
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    status = get_model_status(model_key)
    status["loaded"] = tts_service.is_model_loaded(model_key)

    return status


@app.get("/api/speakers/{model_key}")
async def get_speakers(model_key: str):
    """Get available speakers for a model."""
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    speakers = SPEAKERS.get(model_key, [])
    return {"speakers": speakers}


@app.get("/api/models/{model_key}/download")
async def download_model(model_key: str):
    """Download a model with progress updates via Server-Sent Events."""
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    return EventSourceResponse(
        download_model_with_progress(model_key),
        media_type="text/event-stream",
    )


@app.post("/api/models/{model_key}/load")
async def load_model(model_key: str):
    """Load a model into memory."""
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    if not is_model_downloaded(model_key):
        raise HTTPException(status_code=400, detail="Model not downloaded")

    try:
        tts_service.load_model(model_key)
        return {"success": True, "message": f"Model {model_key} loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/models/{model_key}/unload")
async def unload_model(model_key: str):
    """Unload a model from memory."""
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    tts_service.unload_model(model_key)
    return {"success": True, "message": f"Model {model_key} unloaded"}


@app.post("/api/tts", response_model=TTSResponse)
async def generate_speech(request: TTSRequest):
    """Generate speech from text."""
    if request.model not in MODELS:
        raise HTTPException(status_code=400, detail="Invalid model")

    if not is_model_downloaded(request.model):
        raise HTTPException(
            status_code=400,
            detail=f"Model {request.model} is not downloaded. Please download it first.",
        )

    try:
        audio_bytes, filename = tts_service.generate(
            text=request.text,
            model_key=request.model,
            speaker=request.speaker,
            temperature=request.temperature,
            top_p=request.top_p,
        )

        return TTSResponse(
            success=True,
            filename=filename,
            audio_url=f"/api/audio/{filename}",
            text=request.text,
            model=request.model,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio files."""
    # Security: prevent path traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    audio_path = OUTPUT_DIR / filename

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=audio_path,
        media_type="audio/wav",
        filename=filename,
    )


@app.delete("/api/audio/{filename}")
async def delete_audio(filename: str):
    """Delete a generated audio file."""
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    audio_path = OUTPUT_DIR / filename

    if audio_path.exists():
        os.remove(audio_path)
        return {"success": True, "message": "File deleted"}

    return {"success": False, "message": "File not found"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
