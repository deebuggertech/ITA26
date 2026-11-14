"""Demo data goes through the real offer/produce code so it can't drift from it."""
from . import services
from .db import session
from .schemas import ItemIn


def seed_if_empty() -> None:
    with session() as conn:
        if conn.execute("SELECT COUNT(*) FROM offers").fetchone()[0]:
            return
        offers = {
            "bauer": [
                ItemIn(material="Sperrholzplatten", length_cm=120, width_cm=60, thickness_cm=1.8, quantity=10),
                ItemIn(material="Nägel", quantity=200),
            ],
            "nord": [
                ItemIn(material="Holzbalken", length_cm=300, quantity=12, delivery_own=True),
                ItemIn(material="Nägel", quantity=100),
            ],
            "meier": [
                ItemIn(material="Sperrholzplatten", length_cm=50, width_cm=50, thickness_cm=1.2, quantity=6),
                ItemIn(material="Holzbalken", length_cm=400, quantity=4),
            ],
        }
        for supplier, items in offers.items():
            services.create_offer(conn, supplier, items)
        # Ids follow insertion order: plates, nails and Nord's beams arrive; the rest stays on offer.
        conn.execute("UPDATE items SET status='delivered' WHERE id IN (1, 2, 3)")
        services.produce_modules(conn, "wandelement_leichtbau", 1)
        services.produce_modules(conn, "wandelement_leichtbau", 1)
        services.produce_modules(conn, "holzstaender_element", 1)
