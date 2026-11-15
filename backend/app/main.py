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


app = FastAPI(title="Regnauer Kreislauf-Hilfe", lifespan=lifespan)
app.include_router(router)

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
