import json

from .settings import CONFIG_DIR


def _read(name: str) -> list[dict]:
    return json.loads((CONFIG_DIR / name).read_text(encoding="utf-8"))


def material_types() -> list[dict]:
    return _read("material-types.json")


def criteria() -> list[dict]:
    return _read("parts-criteria.json")
