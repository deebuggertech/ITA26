"""Inventory maths for recipes.

An inventory is a list of item dicts; consuming mutates `quantity` in place and the backend
diffs before/after to credit suppliers. No geometric cutting: only counts, total length or total area.
"""
from math import ceil

MEASURES = {
    "count": lambda i: i["quantity"],
    "length": lambda i: (i.get("length_cm") or 0) * i["quantity"],
    "area": lambda i: (i.get("length_cm") or 0) * (i.get("width_cm") or 0) * i["quantity"],
}

_PIECE = {
    "count": lambda i: 1,
    "length": lambda i: i.get("length_cm") or 0,
    "area": lambda i: (i.get("length_cm") or 0) * (i.get("width_cm") or 0),
}


def total(inventory, material, measure):
    return sum(MEASURES[measure](i) for i in inventory if i["material"] == material)


def consume(inventory, material, measure, amount):
    """Take whole pieces (largest first) until `amount` is covered."""
    remaining = amount
    items = [i for i in inventory if i["material"] == material and i["quantity"] > 0]
    for item in sorted(items, key=_PIECE[measure], reverse=True):
        piece = _PIECE[measure](item)
        if remaining <= 0 or piece <= 0:
            continue
        take = min(item["quantity"], ceil(remaining / piece))
        item["quantity"] -= take
        remaining -= take * piece


def can_build_all(inventory, requirements):
    return all(total(inventory, r["material"], r["measure"]) >= r["amount"] for r in requirements)


def consume_all(inventory, requirements):
    for r in requirements:
        consume(inventory, r["material"], r["measure"], r["amount"])
