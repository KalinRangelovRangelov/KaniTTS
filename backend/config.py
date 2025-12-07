from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "output"

# Ensure directories exist
MODELS_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Model configurations
# Note: German uses the multilingual model (kani-tts-370m) which supports EN, ES, ZH, DE, KO, AR
MODELS = {
    "en": {
        "name": "English",
        "repo_id": "nineninesix/kani-tts-400m-en",
        "local_path": MODELS_DIR / "kani-tts-400m-en",
    },
    "de": {
        "name": "German (Multilingual)",
        "repo_id": "nineninesix/kani-tts-370m",
        "local_path": MODELS_DIR / "kani-tts-370m",
    },
}

# Available speakers per model
# English model (kani-tts-400m-en) - English speakers only
# German/Multilingual model (kani-tts-370m) - supports EN, ES, ZH, DE, KO, AR
SPEAKERS = {
    "en": [
        {"id": "jenny", "name": "Jenny", "gender": "female"},
        {"id": "katie", "name": "Katie", "gender": "female"},
        {"id": "david", "name": "David", "gender": "male"},
        {"id": "andrew", "name": "Andrew", "gender": "male"},
        {"id": "simon", "name": "Simon", "gender": "male"},
        {"id": "puck", "name": "Puck", "gender": "male"},
        {"id": "kore", "name": "Kore", "gender": "female"},
    ],
    "de": [
        {"id": "thorsten", "name": "Thorsten", "gender": "male"},
        {"id": "bert", "name": "Bert", "gender": "male"},
    ],
}

# Audio settings
SAMPLE_RATE = 22050
