import base64
import json
import re
import uuid
from sqlite3 import Connection, Row

from fastapi import HTTPException

from . import config_files, recipe_store, settings
from .auth import USERS
from .schemas import MAX_BATCH, Bounds, ItemIn

_DIM_COLUMNS = {"length": "length_cm", "width": "width_cm", "thickness": "thickness_cm"}
_DATA_URL = re.compile(r"^data:image/(png|jpe?g|webp|gif);base64,(.+)$", re.S)
MAX_PHOTO_BYTES = 5 * 1024 * 1024


def _validate_item(item: ItemIn) -> None:
    material = next((m for m in config_files.material_types() if m["name"] == item.material), None)
    if material is None:
        raise HTTPException(422, f"Unbekanntes Material: {item.material}")
    for field in material["fields"]:
        column = _DIM_COLUMNS.get(field["key"])
        if column and getattr(item, column) is None:
            raise HTTPException(422, f"{item.material}: {field['label']} fehlt")


def _save_photo(data_url: str | None) -> str | None:
    if not data_url:
        return None
    match = _DATA_URL.match(data_url)
    if not match:
        raise HTTPException(422, "Ungültiges Bildformat")
    raw = base64.b64decode(match.group(2))
    if len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(422, "Foto ist größer als 5 MB")
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{match.group(1).replace('jpeg', 'jpg')}"
    (settings.UPLOAD_DIR / name).write_bytes(raw)
    return name


def create_offer(conn: Connection, supplier: str, items: list[ItemIn]) -> int:
    for item in items:
        _validate_item(item)
    needed = set().union(*(r.materials for r in recipe_store.all_recipes()))
    offer_id = conn.execute("INSERT INTO offers (supplier) VALUES (?)", (supplier,)).lastrowid
    for item in items:
        accepted = item.material in needed
        conn.execute(
            """INSERT INTO items (offer_id, supplier, material, length_cm, width_cm, thickness_cm,
               quantity, remaining, delivery_own, delivery_date, note, photo, accepted, reject_reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (offer_id, supplier, item.material, item.length_cm, item.width_cm, item.thickness_cm,
             item.quantity, item.quantity, item.delivery_own, item.delivery_date or None, item.note,
             _save_photo(item.photo_data_url), accepted,
             None if accepted else "Wird aktuell von keinem Modulplan benötigt"),
        )
    return offer_id


def item_out(row: Row) -> dict:
    return {
        **{k: row[k] for k in ("id", "material", "length_cm", "width_cm", "thickness_cm", "quantity",
                               "remaining", "delivery_date", "note", "reject_reason", "status")},
        "supplier_name": USERS[row["supplier"]].display_name,
        "delivery_own": bool(row["delivery_own"]),
        "accepted": bool(row["accepted"]),
        "photo_url": f"/uploads/{row['photo']}" if row["photo"] else None,
    }


def delivered_inventory(conn: Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM items WHERE status='delivered' AND accepted=1 AND remaining>0 ORDER BY id"
    ).fetchall()
    # Recipes only know "quantity"; here that is what is still in stock.
    return [{**dict(r), "quantity": r["remaining"]} for r in rows]


def _persons(value: float) -> int:
    # Half-up; Python's round() would send 2.5 down to 2.
    return int(value + 0.5)


def _max_count(recipe: recipe_store.Recipe, inventory: list[dict]) -> int:
    stock = [dict(i) for i in inventory]
    n = 0
    while n < MAX_BATCH and recipe.can_build(stock):
        recipe.consume_materials(stock)
        n += 1
    return n


def buildable_recipes(conn: Connection) -> list[dict]:
    inventory = delivered_inventory(conn)
    out = []
    for r in recipe_store.all_recipes():
        n = _max_count(r, inventory)
        if n:
            out.append({**r.summary(), "max_count": n})
    return out


def produce_modules(conn: Connection, recipe_id: str, count: int) -> list[int]:
    recipe = recipe_store.get_recipe(recipe_id)
    inventory = delivered_inventory(conn)
    if _max_count(recipe, inventory) < count:
        raise HTTPException(409, "Nicht genug angeliefertes Material")
    original = {i["id"]: i["quantity"] for i in inventory}
    module_ids = []
    for _ in range(count):
        before = {i["id"]: i["quantity"] for i in inventory}
        recipe.consume_materials(inventory)
        used = [i for i in inventory if i["quantity"] != before[i["id"]]]
        module_id = conn.execute(
            "INSERT INTO modules (recipe_id, recipe_name, factor, ratings) VALUES (?,?,?,?)",
            (recipe.id, recipe.meta["name"], recipe.meta["shelter_person_factor"], json.dumps(recipe.meta["ratings"])),
        ).lastrowid
        for supplier in {i["supplier"] for i in used}:
            conn.execute("INSERT INTO module_credits (module_id, supplier) VALUES (?,?)", (module_id, supplier))
        module_ids.append(module_id)
    for item in inventory:
        if item["quantity"] != original[item["id"]]:
            conn.execute("UPDATE items SET remaining=? WHERE id=?", (item["quantity"], item["id"]))
    return module_ids


def supplier_estimate(conn: Connection, username: str) -> dict:
    """Rough upper bound: the single recipe that this supplier's remaining material alone could build most often.

    Real credit is only assigned when Regnauer produces, so this ignores material of other suppliers.
    """
    rows = conn.execute("SELECT * FROM items WHERE supplier=? AND accepted=1 AND remaining>0", (username,)).fetchall()
    inventory = [{**dict(r), "quantity": r["remaining"]} for r in rows]
    best = (0, 0.0, None)
    for recipe in recipe_store.all_recipes():
        n = _max_count(recipe, inventory)
        score = n * recipe.meta["shelter_person_factor"]
        if score > best[1]:
            best = (n, score, recipe.meta["name"])
    credited = next((r for r in scoreboard(conn) if r["name"] == USERS[username].display_name), None)
    return {
        "credited_modules": credited["modules"], "credited_score": credited["score"],
        "potential_modules": best[0], "potential_score": _persons(best[1]), "recipe_name": best[2],
    }


def scoreboard(conn: Connection) -> list[dict]:
    credited = {
        r["supplier"]: (r["modules"], r["score"])
        for r in conn.execute(
            """SELECT c.supplier, COUNT(*) AS modules, SUM(m.factor) AS score
               FROM module_credits c JOIN modules m ON m.id = c.module_id GROUP BY c.supplier"""
        )
    }
    rows = []
    for user in USERS.values():
        if user.role == "supplier":
            modules, score = credited.get(user.username, (0, 0))
            rows.append({"name": user.display_name, "slug": user.username, "kind": "Zulieferer", "modules": modules, "score": score})
    # Regnauer builds every module, so it is credited with all of them.
    total = conn.execute("SELECT COUNT(*) AS n, COALESCE(SUM(factor),0) AS s FROM modules").fetchone()
    rows.append({"name": "Regnauer", "slug": "regnauer", "kind": "Hersteller", "modules": total["n"], "score": total["s"]})
    for row in rows:
        row["score"] = _persons(row["score"])
    # Alphabetical on purpose: the public page lists contributions, it is not a ranking.
    return sorted(rows, key=lambda r: r["name"])


def _matches(criterion: dict, rating, bounds: Bounds) -> bool:
    if criterion["kind"] == "range":
        # The module must be usable across the whole requested interval.
        low, high = rating
        return (bounds.min is None or low <= bounds.min) and (bounds.max is None or high >= bounds.max)
    return (bounds.min is None or rating >= bounds.min) and (bounds.max is None or rating <= bounds.max)


def aid_search(conn: Connection, people: int, filters: dict[str, Bounds]) -> dict:
    criteria = {c["key"]: c for c in config_files.criteria()}
    if set(filters) - set(criteria):
        raise HTTPException(422, "Unbekanntes Kriterium")
    if any(b.min is not None and b.max is not None and b.min > b.max for b in filters.values()):
        raise HTTPException(422, "Untergrenze liegt über der Obergrenze")
    groups = []
    rows = conn.execute(
        "SELECT recipe_id, recipe_name, factor, ratings, COUNT(*) AS n FROM modules GROUP BY recipe_id"
    ).fetchall()
    for r in rows:
        ratings = json.loads(r["ratings"])
        if all(key in ratings and _matches(criteria[key], ratings[key], b) for key, b in filters.items()):
            groups.append({
                "recipe_id": r["recipe_id"], "recipe_name": r["recipe_name"], "count": r["n"],
                "shelter_person_factor": r["factor"], "people": _persons(r["n"] * r["factor"]), "ratings": ratings,
                "_raw_people": r["n"] * r["factor"],
            })
    # Round the sum, not the parts, so the total is not skewed by many small remainders.
    total = _persons(sum(g.pop("_raw_people") for g in groups))
    return {"groups": groups, "total_people": total, "requested": people, "shortfall": max(0, people - total)}
