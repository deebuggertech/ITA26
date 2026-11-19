"""Photo -> material fields via the Gemini API."""
import json
import os
import re

import httpx
from fastapi import HTTPException

from . import config_files
from .schemas import PhotoAnalysis

MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
# Tried when the main model answers 429/503.
FALLBACK_MODEL = "gemini-flash-lite-latest"
_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_DATA_URL = re.compile(r"^data:(image/(?:png|jpe?g|webp));base64,(.+)$", re.S)
MAX_IMAGE_CHARS = 7 * 1024 * 1024

_NUMBER = {"type": "NUMBER", "nullable": True}


def _response_schema(names: list[str]) -> dict:
    return {
        "type": "OBJECT",
        "properties": {
            "material": {"type": "STRING", "enum": names, "nullable": True},
            "length_cm": _NUMBER, "width_cm": _NUMBER, "thickness_cm": _NUMBER, "diameter_cm": _NUMBER,
            "weight_kg": _NUMBER,
            "quantity": {"type": "INTEGER", "nullable": True},
            "note": {"type": "STRING"},
        },
        "required": ["material", "quantity", "note"],
    }


def _prompt(types: list[dict]) -> str:
    formats = [
        {"material": t["name"], "description": t["description"],
         "fields": [{"key": f["key"], "label": f["label"], "integer": f.get("integer", False)} for f in t["fields"]]}
        for t in types
    ]
    return (
        "Das Foto zeigt Restmaterial (Bauteilreste), das ein Zulieferer anbieten möchte. "
        "Bestimme das Material und die Maße. Erlaubte Materialien und ihre benötigten Felder:\n"
        f"{json.dumps(formats, ensure_ascii=False)}\n"
        "Feldzuordnung: length→length_cm, width→width_cm, thickness→thickness_cm, diameter→diameter_cm, "
        "weight→weight_kg, quantity→quantity. Längenangaben in cm, Gewicht in kg, Anzahl als ganze Zahl. "
        "Sei selbstbewusst und entscheidungsfreudig: Du bist ein erfahrener Holzbau-Gutachter, der Maße auf einen Blick "
        "einschätzt. Eine plausible Schätzung ist immer besser als null. Fülle ALLE Felder des gewählten Materials mit "
        "einer konkreten Zahl, auch wenn du dir unsicher bist; Unsicherheit gehört nur in note, nie in ein leeres Feld. "
        "Gib immer den wahrscheinlichsten Wert an und lege dich fest. "
        "Schätze Längen und Maße über Referenzobjekte im Bild und im Hintergrund: Hände und Finger, Personen, Türen "
        "(ca. 200 cm hoch), Paletten (Europalette 120 × 80 cm, 14,4 cm hoch), Ziegel, Schrauben, Paletten-Umreifungen, "
        "Maßbänder, Beschriftungen und Etiketten, Wände, Regale und Fahrzeuge. Nutze außerdem bekannte Handelsmaße "
        "(z. B. Balken 3 oder 4 m, Dachlatten 30 × 50 mm, Platten 250 × 125 cm oder 244 × 122 cm, "
        "Plattendicken 12 / 18 / 21 mm) und runde auf plausible Standardwerte. "
        "Zähle die sichtbaren Stücke für quantity; bei Stapeln oder Bündeln schätze die Anzahl aus Reihen × Lagen "
        "und gib einen plausiblen Wert an, mindestens 1. Bei Schüttgut oder Säcken schätze das Gewicht aus der Größe. "
        "Nur Felder, die nicht zum gewählten Material gehören, bleiben null. Für material wähle das ähnlichste "
        "erlaubte Material; null nur, wenn das Bild gar kein Baumaterial zeigt. "
        "note: ein kurzer deutscher Satz, worauf die Schätzung beruht (z. B. Referenzobjekt) und wie sicher sie ist."
    )


def _generate(payload: dict) -> dict:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Bilderkennung nicht konfiguriert (GEMINI_API_KEY fehlt)")
    for model in (MODEL, FALLBACK_MODEL):
        # Header instead of query string keeps the key out of access logs.
        try:
            r = httpx.post(_URL.format(model=model), json=payload, headers={"x-goog-api-key": key}, timeout=40)
        except httpx.HTTPError:
            raise HTTPException(502, "Bilderkennung nicht erreichbar")
        if r.status_code not in (429, 503):
            break
    if r.status_code != 200:
        is_json = r.headers.get("content-type", "").startswith("application/json")
        reason = (r.json().get("error", {}).get("message") if is_json else "") or ""
        raise HTTPException(502, f"Bilderkennung fehlgeschlagen ({r.status_code}): {reason[:200]}")
    return r.json()


def analyze_photo(image_data_url: str) -> PhotoAnalysis:
    match = _DATA_URL.match(image_data_url)
    if not match or len(image_data_url) > MAX_IMAGE_CHARS:
        raise HTTPException(422, "Ungültiges oder zu großes Bild")
    types = config_files.material_types()
    payload = {
        "contents": [{"parts": [
            {"text": _prompt(types)},
            {"inline_data": {"mime_type": match.group(1), "data": match.group(2)}},
        ]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _response_schema([t["name"] for t in types]),
            "temperature": 0.4,
        },
    }
    body = _generate(payload)
    try:
        text = body["candidates"][0]["content"]["parts"][0]["text"]
        return PhotoAnalysis.model_validate_json(text)
    except (KeyError, IndexError, ValueError):
        raise HTTPException(502, "Bilderkennung lieferte keine verwertbare Antwort")
