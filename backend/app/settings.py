import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent

# Overridable so tests can use isolated copies.
DB_PATH = Path(os.environ.get("RELIEF_DB", BASE / "data" / "relief.db"))
UPLOAD_DIR = Path(os.environ.get("RELIEF_UPLOADS", BASE / "data" / "uploads"))
RECIPES_DIR = Path(os.environ.get("RELIEF_RECIPES", BASE / "recipes"))
CONFIG_DIR = BASE / "config"
