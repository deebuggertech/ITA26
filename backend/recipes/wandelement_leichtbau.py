from _helpers import can_build_all, consume_all

# META-BEGIN
META = {
    "name": "Wandelement Leichtbau",
    "description": "Leichtes Wandelement aus Platten, mit Nägeln verbunden.",
    "build_minutes": 20,
    "shelter_person_factor": 0.25,
    "ratings": {"temperature": [-5, 30], "snow_load": 1.5, "insulation": 1.2},
}
# META-END

# 2x 40x40 cm + 4x 10x30 cm = 4400 cm²; larger plates are accepted, only the total area counts.
REQUIREMENTS = [
    {"material": "Sperrholzplatten", "measure": "area", "amount": 2 * 40 * 40 + 4 * 10 * 30},
    {"material": "Nägel", "measure": "count", "amount": 20},
]


def can_build(inventory):
    return can_build_all(inventory, REQUIREMENTS)


def consume_materials(inventory):
    consume_all(inventory, REQUIREMENTS)
