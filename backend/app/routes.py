import json
from sqlite3 import Connection

from fastapi import APIRouter, Depends, HTTPException

from . import auth, config_files, recipe_store, schemas, services
from .db import get_db

router = APIRouter(prefix="/api")

# Function scope makes the commit happen before the response is sent. With the default
# request scope it runs afterwards, so a client that refetches right after a write reads stale data.
DB = Depends(get_db, scope="function")

supplier_only = auth.require_role("supplier")
logistics_only = auth.require_role("logistics")
manufacturer_only = auth.require_role("manufacturer")
aid_only = auth.require_role("aid")


# --- auth & config ---------------------------------------------------------

@router.get("/auth/demo-users", response_model=list[schemas.DemoUser])
def demo_users():
    return [u.__dict__ for u in auth.USERS.values()]


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(body: schemas.LoginRequest):
    token, user = auth.login(body.username, body.password)
    return {"token": token, **user.__dict__}


@router.get("/config/material-types")
def material_types():
    return config_files.material_types()


@router.get("/config/criteria")
def criteria():
    return config_files.criteria()


# --- Zulieferer & Speditionen ---------------------------------------------

@router.post("/offers", response_model=schemas.OfferResult)
def create_offer(body: schemas.OfferIn, user: auth.User = supplier_only, db: Connection = DB):
    offer_id = services.create_offer(db, user.username, body.items)
    return _offer_result(db, offer_id)


@router.get("/offers/{offer_id}", response_model=schemas.OfferResult)
def get_offer(offer_id: int, user: auth.User = supplier_only, db: Connection = DB):
    result = _offer_result(db, offer_id)
    if db.execute("SELECT supplier FROM offers WHERE id=?", (offer_id,)).fetchone()["supplier"] != user.username:
        raise HTTPException(403, "Keine Berechtigung")
    return result


def _offer_result(db: Connection, offer_id: int) -> dict:
    rows = db.execute("SELECT * FROM items WHERE offer_id=? ORDER BY id", (offer_id,)).fetchall()
    if not rows:
        raise HTTPException(404, "Angebot nicht gefunden")
    return {"offer_id": offer_id, "items": [services.item_out(r) for r in rows]}


@router.post("/logistics", status_code=201)
def upload_route_data(body: schemas.LogisticsIn, user: auth.User = logistics_only, db: Connection = DB):
    try:
        json.loads(body.content)
    except json.JSONDecodeError:
        raise HTTPException(422, "Die Datei enthält kein gültiges JSON")
    db.execute("INSERT INTO logistics (username, filename, content) VALUES (?,?,?)",
               (user.username, body.filename, body.content))


# --- Regnauer --------------------------------------------------------------

@router.get("/regnauer/items", response_model=list[schemas.ItemOut])
def accepted_items(_: auth.User = manufacturer_only, db: Connection = DB):
    rows = db.execute("SELECT * FROM items WHERE accepted=1 ORDER BY id DESC").fetchall()
    return [services.item_out(r) for r in rows]


@router.post("/regnauer/items/{item_id}/deliver", response_model=schemas.ItemOut)
def mark_delivered(item_id: int, _: auth.User = manufacturer_only, db: Connection = DB):
    db.execute("UPDATE items SET status='delivered' WHERE id=? AND accepted=1", (item_id,))
    row = db.execute("SELECT * FROM items WHERE id=? AND accepted=1", (item_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Material nicht gefunden")
    return services.item_out(row)


@router.get("/regnauer/buildable", response_model=list[schemas.BuildableRecipe])
def buildable(_: auth.User = manufacturer_only, db: Connection = DB):
    return services.buildable_recipes(db)


@router.post("/regnauer/produce/{recipe_id}", response_model=list[schemas.ModuleOut])
def produce(recipe_id: str, body: schemas.ProduceIn = schemas.ProduceIn(),
            _: auth.User = manufacturer_only, db: Connection = DB):
    ids = services.produce_modules(db, recipe_id, body.count)
    marks = ",".join("?" * len(ids))
    rows = db.execute(f"SELECT * FROM modules WHERE id IN ({marks}) ORDER BY id DESC", ids).fetchall()
    return [_module_out(r) for r in rows]


@router.get("/regnauer/modules", response_model=list[schemas.ModuleOut])
def stock(_: auth.User = manufacturer_only, db: Connection = DB):
    return [_module_out(r) for r in db.execute("SELECT * FROM modules ORDER BY id DESC")]


def _module_out(row) -> dict:
    return {"id": row["id"], "recipe_id": row["recipe_id"], "recipe_name": row["recipe_name"],
            "shelter_person_factor": row["factor"], "produced_at": row["produced_at"]}


@router.get("/regnauer/recipes", response_model=list[schemas.Recipe])
def recipes(_: auth.User = manufacturer_only):
    return [r.summary() for r in recipe_store.all_recipes()]


def _check_ratings(ratings: dict[str, int]) -> None:
    keys = {c["key"] for c in config_files.criteria()}
    if set(ratings) != keys or not all(1 <= v <= 10 for v in ratings.values()):
        raise HTTPException(422, "Bewertungen müssen für alle Kriterien zwischen 1 und 10 liegen")


@router.put("/regnauer/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: str, body: schemas.RecipeMetaUpdate, _: auth.User = manufacturer_only):
    _check_ratings(body.ratings)
    return recipe_store.update_meta(recipe_id, body.model_dump()).summary()


# --- Zulieferer-Schätzung ----------------------------------------------------

@router.get("/supplier/estimate", response_model=schemas.SupplierEstimate)
def supplier_estimate(user: auth.User = supplier_only, db: Connection = DB):
    return services.supplier_estimate(db, user.username)


# --- öffentlich & Hilfsorganisationen -------------------------------------

@router.get("/scoreboard", response_model=list[schemas.ScoreRow])
def scoreboard(db: Connection = DB):
    return services.scoreboard(db)


@router.post("/aid/search", response_model=schemas.AidResult)
def aid_search(body: schemas.AidQuery, _: auth.User = aid_only, db: Connection = DB):
    return services.aid_search(db, body.people, body.min_ratings)
