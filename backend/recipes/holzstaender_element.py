from _helpers import can_build_all, consume_all

# META-BEGIN
META = {
    "name": "Holzständerbauweise-Element",
    "description": "Tragendes Element aus Holzbalken und beplankten Platten.",
    "build_minutes": 45,
    "shelter_person_factor": 0.5,
    "ratings": {"stability": 8, "insulation": 6, "weather": 7},
}
# META-END

REQUIREMENTS = [
    {"material": "Holzbalken", "measure": "length", "amount": 1200},
    {"material": "Sperrholzplatten", "measure": "area", "amount": 14400},
]


def can_build(inventory):
    return can_build_all(inventory, REQUIREMENTS)


def consume_materials(inventory):
    consume_all(inventory, REQUIREMENTS)
