import sqlite3
from contextlib import contextmanager

from . import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY, supplier TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY, offer_id INTEGER NOT NULL REFERENCES offers(id), supplier TEXT NOT NULL,
    material TEXT NOT NULL, length_cm REAL, width_cm REAL, thickness_cm REAL, diameter_cm REAL, weight_kg REAL,
    quantity INTEGER NOT NULL, remaining INTEGER NOT NULL,
    delivery_own INTEGER NOT NULL, delivery_date TEXT, note TEXT NOT NULL DEFAULT '', photo TEXT,
    accepted INTEGER NOT NULL, reject_reason TEXT,
    status TEXT NOT NULL DEFAULT 'offered'
);
CREATE TABLE IF NOT EXISTS logistics (
    id INTEGER PRIMARY KEY, username TEXT NOT NULL, filename TEXT NOT NULL, content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY, recipe_id TEXT NOT NULL, recipe_name TEXT NOT NULL,
    factor REAL NOT NULL, ratings TEXT NOT NULL, produced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS module_credits (
    module_id INTEGER NOT NULL REFERENCES modules(id), supplier TEXT NOT NULL
);
"""


def connect() -> sqlite3.Connection:
    settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    # FastAPI runs a sync dependency's setup/teardown on different pool threads; the connection is per-request and never shared concurrently.
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def session():
    conn = connect()
    try:
        with conn:  # commit on success, roll back on error
            yield conn
    finally:
        conn.close()


def get_db():
    with session() as conn:
        yield conn


# Columns added after the first release; CREATE TABLE IF NOT EXISTS does not touch existing databases.
_ADDED_ITEM_COLUMNS = ("diameter_cm", "weight_kg")


def init_db() -> None:
    with session() as conn:
        conn.executescript(SCHEMA)
        have = {r["name"] for r in conn.execute("PRAGMA table_info(items)")}
        for column in _ADDED_ITEM_COLUMNS:
            if column not in have:
                conn.execute(f"ALTER TABLE items ADD COLUMN {column} REAL")
