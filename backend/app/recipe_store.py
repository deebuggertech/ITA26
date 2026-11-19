"""Recipes are plain Python files, re-imported on every call so edits apply without a restart."""
import importlib.util
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType

from fastapi import HTTPException

from . import settings

_META_BLOCK = re.compile(r"# META-BEGIN\n.*?# META-END", re.S)


@dataclass
class Recipe:
    id: str
    module: ModuleType

    @property
    def meta(self) -> dict:
        return self.module.META

    @property
    def materials(self) -> set[str]:
        required = {r["material"] for r in getattr(self.module, "REQUIREMENTS", [])}
        return required | set(self.meta.get("materials", []))

    def can_build(self, inventory: list[dict]) -> bool:
        return bool(self.module.can_build(inventory))

    def consume_materials(self, inventory: list[dict]) -> None:
        self.module.consume_materials(inventory)

    def summary(self) -> dict:
        return {"id": self.id, **self.meta}


def _load(path: Path) -> Recipe:
    # Recipes import `_helpers` as a sibling module.
    if str(settings.RECIPES_DIR) not in sys.path:
        sys.path.insert(0, str(settings.RECIPES_DIR))
    spec = importlib.util.spec_from_file_location(f"recipe_{path.stem}", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return Recipe(path.stem, module)


def all_recipes() -> list[Recipe]:
    paths = sorted(p for p in settings.RECIPES_DIR.glob("*.py") if not p.name.startswith("_"))
    return [_load(p) for p in paths]


def get_recipe(recipe_id: str) -> Recipe:
    path = settings.RECIPES_DIR / f"{recipe_id}.py"
    if recipe_id.startswith("_") or not path.is_file():
        raise HTTPException(404, "Modulplan nicht gefunden")
    return _load(path)


def update_meta(recipe_id: str, changes: dict) -> Recipe:
    recipe = get_recipe(recipe_id)
    path = settings.RECIPES_DIR / f"{recipe_id}.py"
    source = path.read_text(encoding="utf-8")
    if not _META_BLOCK.search(source):
        raise HTTPException(409, "Dieser Modulplan hat keinen bearbeitbaren META-Block")
    # JSON literals of str/number/list/dict are valid Python.
    fields = ",\n".join(f"    {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in {**recipe.meta, **changes}.items())
    block = f"# META-BEGIN\nMETA = {{\n{fields},\n}}\n# META-END"
    path.write_text(_META_BLOCK.sub(lambda _: block, source, count=1), encoding="utf-8")
    return get_recipe(recipe_id)
