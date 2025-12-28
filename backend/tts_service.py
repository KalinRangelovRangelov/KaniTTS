import io
import re
import uuid
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import torch

from config import MODELS, OUTPUT_DIR, SAMPLE_RATE, SPEAKERS
from downloader import is_model_downloaded


# Maximum characters per chunk to avoid hitting model's token limit
# The model has max_new_tokens=1200, which roughly corresponds to ~10-15 seconds of audio
# Shorter chunks (~150-200 chars) work more reliably
MAX_CHUNK_CHARS = 200


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences for chunked TTS generation.
    Handles German and English punctuation patterns.
    """
    # Normalize whitespace
    text = " ".join(text.split())

    # Split on sentence-ending punctuation followed by space or end
    # This regex handles: . ! ? and German quotation patterns
    sentences = re.split(r'(?<=[.!?])\s+', text)

    # Filter empty strings and strip whitespace
    sentences = [s.strip() for s in sentences if s.strip()]

    # Further split long sentences that exceed MAX_CHUNK_CHARS
    chunks = []
    for sentence in sentences:
        if len(sentence) <= MAX_CHUNK_CHARS:
            chunks.append(sentence)
        else:
            # Split long sentences on commas, semicolons, or dashes
            sub_parts = re.split(r'(?<=[,;–—])\s+', sentence)
            current_chunk = ""
            for part in sub_parts:
                if len(current_chunk) + len(part) + 1 <= MAX_CHUNK_CHARS:
                    current_chunk = (current_chunk + " " + part).strip() if current_chunk else part
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    # If single part is still too long, just add it anyway
                    current_chunk = part
            if current_chunk:
                chunks.append(current_chunk)

    return chunks if chunks else [text]


class TTSService:
    """Service for text-to-speech generation using Kani TTS."""

    # Default speaker IDs for each model
    DEFAULT_SPEAKERS = {
        "en": "jenny",      # English
        "de": "thorsten",   # German
    }

    def __init__(self):
        self._models: dict = {}
        self._current_model_key: Optional[str] = None

    def _get_device(self) -> str:
        """Get the best available device."""
        if torch.backends.mps.is_available():
            return "mps"  # Apple Silicon
        elif torch.cuda.is_available():
            return "cuda"
        return "cpu"

    def load_model(self, model_key: str) -> bool:
        """Load a model into memory."""
        if model_key not in MODELS:
            raise ValueError(f"Unknown model: {model_key}")

        if not is_model_downloaded(model_key):
            raise RuntimeError(f"Model {model_key} is not downloaded")

        # If model already loaded, just return
        if model_key in self._models:
            self._current_model_key = model_key
            return True

        try:
            from kani_tts import KaniTTS

            model_path = str(MODELS[model_key]["local_path"])

            print(f"Loading model {model_key}...")

            # Load the model (use CPU - MPS has issues with this model)
            model = KaniTTS(model_path, device_map="cpu")

            self._models[model_key] = model
            self._current_model_key = model_key

            print(f"Model {model_key} loaded successfully")
            return True

        except Exception as e:
            print(f"Error loading model: {e}")
            raise RuntimeError(f"Failed to load model: {e}")

    def unload_model(self, model_key: str) -> bool:
        """Unload a model from memory."""
        if model_key in self._models:
            del self._models[model_key]
            if self._current_model_key == model_key:
                self._current_model_key = None
            return True
        return False

    def generate(
        self,
        text: str,
        model_key: str,
        speaker: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> Tuple[bytes, str]:
        """
        Generate speech from text.

        Returns:
            Tuple of (audio_bytes, output_filename)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        # Load model if not loaded
        if model_key not in self._models:
            self.load_model(model_key)

        model = self._models[model_key]

        try:
            # Get speaker ID - use provided speaker or fall back to default
            speaker_id = speaker or self.DEFAULT_SPEAKERS.get(model_key)
            print(f"[TTS] Generating with speaker_id={speaker_id} (requested: {speaker})")

            # Split text into chunks to avoid hitting model's token limit
            chunks = split_into_sentences(text)
            print(f"[TTS] Split text into {len(chunks)} chunks")

            # Generate audio for each chunk
            audio_arrays = []
            for i, chunk in enumerate(chunks):
                print(f"[TTS] Generating chunk {i+1}/{len(chunks)}: {chunk[:50]}...")
                chunk_audio, _ = model(chunk, speaker_id=speaker_id)
                audio_arrays.append(chunk_audio)

            # Concatenate all audio chunks
            if len(audio_arrays) == 1:
                combined_audio = audio_arrays[0]
            else:
                # Add small silence between chunks for natural pauses
                silence = np.zeros(int(SAMPLE_RATE * 0.15), dtype=np.float32)  # 150ms pause
                combined_parts = []
                for i, audio in enumerate(audio_arrays):
                    combined_parts.append(audio)
                    if i < len(audio_arrays) - 1:  # Don't add silence after last chunk
                        combined_parts.append(silence)
                combined_audio = np.concatenate(combined_parts)

            # Generate unique filename
            filename = f"output_{uuid.uuid4().hex[:8]}.wav"
            output_path = OUTPUT_DIR / filename

            # Save audio
            model.save_audio(combined_audio, str(output_path))

            # Read the file bytes
            with open(output_path, "rb") as f:
                audio_bytes = f.read()

            return audio_bytes, filename

        except Exception as e:
            print(f"Error generating audio: {e}")
            raise RuntimeError(f"Failed to generate audio: {e}")

    def get_loaded_models(self) -> list:
        """Get list of currently loaded models."""
        return list(self._models.keys())

    def is_model_loaded(self, model_key: str) -> bool:
        """Check if a model is loaded."""
        return model_key in self._models


# Global singleton
tts_service = TTSService()
