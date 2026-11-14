import json

from .settings import CONFIG_DIR


def material_types() -> list[dict]:
    return json.loads((CONFIG_DIR / "material-types.json").read_text(encoding="utf-8"))


def criteria() -> list[dict]:
    return json.loads((CONFIG_DIR / "parts-criteria.json").read_text(encoding="utf-8"))
