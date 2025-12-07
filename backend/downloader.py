import asyncio
import json
import logging
from pathlib import Path
from typing import AsyncGenerator, Optional

from huggingface_hub import snapshot_download, HfApi
from huggingface_hub.utils import GatedRepoError, RepositoryNotFoundError

from config import MODELS, MODELS_DIR

logger = logging.getLogger(__name__)


class DownloadProgress:
    """Tracks download progress for a model."""

    def __init__(self, model_key: str):
        self.model_key = model_key
        self.total_size: int = 0
        self.downloaded_size: int = 0
        self.current_file: str = ""
        self.status: str = "pending"  # pending, downloading, completed, error
        self.error_message: Optional[str] = None
        self.files_total: int = 0
        self.files_downloaded: int = 0

    @property
    def progress_percent(self) -> float:
        if self.total_size == 0:
            return 0.0
        return min(100.0, (self.downloaded_size / self.total_size) * 100)

    def to_dict(self) -> dict:
        return {
            "model_key": self.model_key,
            "model_name": MODELS[self.model_key]["name"],
            "total_size": self.total_size,
            "downloaded_size": self.downloaded_size,
            "progress_percent": round(self.progress_percent, 1),
            "current_file": self.current_file,
            "status": self.status,
            "error_message": self.error_message,
            "files_total": self.files_total,
            "files_downloaded": self.files_downloaded,
        }


def is_model_downloaded(model_key: str) -> bool:
    """Check if a model is already downloaded."""
    if model_key not in MODELS:
        return False

    local_path = MODELS[model_key]["local_path"]
    if not local_path.exists():
        return False

    # Check for essential files
    essential_patterns = ["*.safetensors", "config.json", "*.bin"]
    for pattern in essential_patterns:
        files = list(local_path.glob(pattern))
        if files:
            return True

    return False


def get_model_status(model_key: str) -> dict:
    """Get the status of a model."""
    if model_key not in MODELS:
        return {"exists": False, "error": "Unknown model"}

    model = MODELS[model_key]
    downloaded = is_model_downloaded(model_key)

    return {
        "key": model_key,
        "name": model["name"],
        "repo_id": model["repo_id"],
        "downloaded": downloaded,
        "local_path": str(model["local_path"]) if downloaded else None,
    }


def get_all_models_status() -> dict:
    """Get status of all available models."""
    return {key: get_model_status(key) for key in MODELS}


def _get_dir_size(path: Path) -> int:
    """Calculate total size of files in directory."""
    try:
        return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    except Exception:
        return 0


def _get_file_count(path: Path) -> int:
    """Count files in directory."""
    try:
        return len([f for f in path.rglob("*") if f.is_file()])
    except Exception:
        return 0


async def download_model_with_progress(model_key: str) -> AsyncGenerator[str, None]:
    """Download a model with progress updates via SSE."""

    if model_key not in MODELS:
        yield f"data: {json.dumps({'status': 'error', 'error_message': 'Unknown model'})}\n\n"
        return

    model = MODELS[model_key]
    progress = DownloadProgress(model_key)

    # Check if already downloaded
    if is_model_downloaded(model_key):
        progress.status = "completed"
        progress.downloaded_size = 1
        progress.total_size = 1
        yield f"data: {json.dumps(progress.to_dict())}\n\n"
        return

    progress.status = "downloading"
    yield f"data: {json.dumps(progress.to_dict())}\n\n"

    # Small delay to ensure SSE connection is established
    await asyncio.sleep(0.1)

    try:
        # Get repo info for file sizes
        logger.info(f"Getting repo info for {model['repo_id']}")

        def get_repo_info():
            api = HfApi()
            return api.repo_info(repo_id=model["repo_id"], repo_type="model")

        loop = asyncio.get_event_loop()
        repo_info = await loop.run_in_executor(None, get_repo_info)

        # Calculate total size
        siblings = repo_info.siblings or []
        progress.files_total = len(siblings)
        progress.total_size = sum(s.size or 0 for s in siblings)

        logger.info(f"Total size: {progress.total_size}, files: {progress.files_total}")

        yield f"data: {json.dumps(progress.to_dict())}\n\n"

        # Download in a thread to not block
        local_path = Path(model["local_path"])
        local_path.mkdir(parents=True, exist_ok=True)

        def do_download():
            logger.info(f"Starting download to {local_path}")
            return snapshot_download(
                repo_id=model["repo_id"],
                local_dir=str(local_path),
                local_dir_use_symlinks=False,
            )

        # Run download in thread and poll for progress
        download_task = loop.run_in_executor(None, do_download)

        # Poll the directory for progress while downloading
        while not download_task.done():
            await asyncio.sleep(1.0)

            # Calculate current download progress by checking local files
            progress.downloaded_size = _get_dir_size(local_path)
            progress.files_downloaded = _get_file_count(local_path)

            yield f"data: {json.dumps(progress.to_dict())}\n\n"

        # Wait for completion and check for exceptions
        try:
            result = await download_task
            logger.info(f"Download completed: {result}")
        except Exception as e:
            logger.error(f"Download task failed: {e}")
            raise

        progress.status = "completed"
        progress.downloaded_size = progress.total_size
        yield f"data: {json.dumps(progress.to_dict())}\n\n"

    except GatedRepoError:
        progress.status = "error"
        progress.error_message = "This model requires authentication. Please log in to Hugging Face."
        yield f"data: {json.dumps(progress.to_dict())}\n\n"
    except RepositoryNotFoundError:
        progress.status = "error"
        progress.error_message = "Model repository not found."
        yield f"data: {json.dumps(progress.to_dict())}\n\n"
    except Exception as e:
        logger.exception(f"Download error: {e}")
        progress.status = "error"
        progress.error_message = str(e)
        yield f"data: {json.dumps(progress.to_dict())}\n\n"
