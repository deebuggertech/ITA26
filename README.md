# Regnauer Kreislauf-Hilfe (Prototyp)

## Start
Backend (Port 8000, legt Demo-Daten beim ersten Start an):

    cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/uvicorn app.main:app --reload

Frontend (Port 5173, proxyt /api an das Backend):

    cd frontend && npm install && npm run dev

Demo-Logins (Passwort `demo`): bauer, nord, meier (Zulieferer), nordlicht (Spedition), regnauer, drk (Hilfsorganisation).
Reset: `backend/data/` löschen.

## Anpassbar ohne Code
- `backend/config/material-types.json`, `backend/config/parts-criteria.json`
- `backend/recipes/*.py`: `META`, `can_build(inventory)`, `consume_materials(inventory)`; Helfer in `_helpers.py`
- Farben: Variablen am Anfang von `frontend/src/styles.css`
- Logo/Hintergrund: `frontend/public/logo.jpg`, `hero.jpg` ersetzen (Pfad in `--hero-image`)

## Demo-Website (iframe-Einbettung)
Beispiel einer Firmenwebsite mit dem Badge (Frontend muss auf :5173 laufen):

    cd demo-site && python3 -m http.server 5174

Badge-Code pro Unternehmen: Scoreboard-Seite, Spalte „Einbetten“. Standort-Marker der Karte: `frontend/src/shelterSites.ts`.
