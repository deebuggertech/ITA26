import shutil

import pytest
from fastapi.testclient import TestClient

from app import settings


@pytest.fixture()
def client(tmp_path, monkeypatch):
    recipes = tmp_path / "recipes"
    shutil.copytree(settings.BASE / "recipes", recipes, ignore=shutil.ignore_patterns("__pycache__"))
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "t.db")
    monkeypatch.setattr(settings, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(settings, "RECIPES_DIR", recipes)
    from app.main import app

    with TestClient(app) as c:
        yield c


def login(client, username):
    r = client.post("/api/auth/login", json={"username": username, "password": "demo"})
    return {"Authorization": f"Bearer {r.json()['token']}"}
