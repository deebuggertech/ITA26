import sqlite3
from contextlib import contextmanager

from . import settings

SCHEMA = """
CREATE TABLE offers (
    id INTEGER PRIMARY KEY, supplier TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE items (
    id INTEGER PRIMARY KEY, offer_id INTEGER NOT NULL REFERENCES offers(id), supplier TEXT NOT NULL,
    material TEXT NOT NULL, length_cm REAL, width_cm REAL, thickness_cm REAL, diameter_cm REAL, weight_kg REAL,
    quantity INTEGER NOT NULL, remaining INTEGER NOT NULL,
    delivery_own INTEGER NOT NULL, delivery_date TEXT, note TEXT NOT NULL DEFAULT '', photo TEXT,
    accepted INTEGER NOT NULL, reject_reason TEXT,
    status TEXT NOT NULL DEFAULT 'offered'
);
CREATE TABLE logistics (
    id INTEGER PRIMARY KEY, username TEXT NOT NULL, filename TEXT NOT NULL, content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE modules (
    id INTEGER PRIMARY KEY, recipe_id TEXT NOT NULL, recipe_name TEXT NOT NULL,
    factor REAL NOT NULL, ratings TEXT NOT NULL, produced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE module_credits (
    module_id INTEGER NOT NULL REFERENCES modules(id), supplier TEXT NOT NULL
);
"""


@contextmanager
def session():
    settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Sync dependencies are set up and torn down on different pool threads; the connection is never shared concurrently.
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def get_db():
    with session() as conn:
        yield conn


def init_db() -> None:
    with session() as conn:
        conn.executescript(SCHEMA)
