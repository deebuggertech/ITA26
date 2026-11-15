"""Demo data goes through the real offer/produce code so it can't drift from it."""
import shutil

from . import services, settings
from .db import init_db, session
from .schemas import ItemIn


def reset_and_seed() -> None:
    """Every backend start begins from the same demo state; nothing persists across restarts."""
    settings.DB_PATH.unlink(missing_ok=True)
    shutil.rmtree(settings.UPLOAD_DIR, ignore_errors=True)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    with session() as conn:
        offers = {
            "bauer": [
                ItemIn(material="Sperrholzplatten", length_cm=120, width_cm=60, thickness_cm=1.8, quantity=44),
                ItemIn(material="Nägel", quantity=200),
            ],
            "nord": [
                ItemIn(material="Holzbalken", length_cm=300, quantity=40, delivery_own=True),
                ItemIn(material="Nägel", quantity=400),
                ItemIn(material="Sperrholzplatten", length_cm=80, width_cm=80, thickness_cm=1.5, quantity=10),
            ],
            "meier": [
                ItemIn(material="Sperrholzplatten", length_cm=50, width_cm=50, thickness_cm=1.2, quantity=20),
                ItemIn(material="Holzbalken", length_cm=400, quantity=4),
                ItemIn(material="Nägel", quantity=300),
            ],
        }
        for supplier, items in offers.items():
            services.create_offer(conn, supplier, items)
        # Ids follow insertion order: Nord's plates (5) and Meier's beams (7) stay on offer, everything else arrived.
        conn.execute("UPDATE items SET status='delivered' WHERE id IN (1, 2, 3, 4, 6, 8)")
        services.produce_modules(conn, "wandelement_leichtbau", 24)
        services.produce_modules(conn, "holzstaender_element", 8)
