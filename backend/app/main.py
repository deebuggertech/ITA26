import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import settings
from .routes import router
from .seed import reset_and_seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    reset_and_seed()
    yield


# Refuse to start via a bare `uvicorn app.main:app` (it would default to port 8000).
if sys.argv and sys.argv[0].endswith("uvicorn") and f"--port={settings.BACKEND_PORT}" not in " ".join(sys.argv).replace("--port ", "--port="):
    raise SystemExit(f"Wrong port. Start the backend with `python -m app` (port {settings.BACKEND_PORT}).")

app = FastAPI(title="Regnauer Kreislauf-Hilfe", lifespan=lifespan)
app.include_router(router)

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
