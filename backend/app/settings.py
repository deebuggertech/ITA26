import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent

# Optional backend/.env with KEY=VALUE lines (e.g. GEMINI_API_KEY); real environment variables win.
_env = BASE / ".env"
if _env.is_file():
    for line in _env.read_text(encoding="utf-8").splitlines():
        key, sep, value = line.partition("=")
        if sep and not key.strip().startswith("#"):
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))

# Overridable so tests can use isolated copies.
DB_PATH = Path(os.environ.get("RELIEF_DB", BASE / "data" / "relief.db"))
UPLOAD_DIR = Path(os.environ.get("RELIEF_UPLOADS", BASE / "data" / "uploads"))
RECIPES_DIR = Path(os.environ.get("RELIEF_RECIPES", BASE / "recipes"))
CONFIG_DIR = BASE / "config"
