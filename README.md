# Regnauer Kreislauf-Hilfe (Prototyp)

## Start
Alle Befehle im Projektverzeichnis (`ITA26/`) ausführen. Die Klammern `( … )` starten eine Subshell, deshalb bleibt das aktuelle Verzeichnis unverändert.

Einmalige Einrichtung:

    (cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt)
    npm --prefix frontend install

Backend (Port 8000):

    (cd backend && .venv/bin/uvicorn app.main:app --reload)

Frontend (Port 5173, proxyt /api an das Backend), in einem zweiten Terminal:

    npm --prefix frontend run dev

## Neustart
Laufende Instanzen beenden und beide neu starten (jeweils aus dem Projektverzeichnis):

    pkill -f "uvicorn app.main"; pkill -f "vite"
    (cd backend && .venv/bin/uvicorn app.main:app --reload)      # Terminal 1
    npm --prefix frontend run dev                                # Terminal 2

Bei **jedem Backend-Start** wird die Datenbank gelöscht und mit den Demodaten neu befüllt (Angebote, Anlieferungen, bereits produzierte Module). Hochgeladene Fotos werden ebenfalls gelöscht. Das gilt auch für den automatischen Reload bei Code-Änderungen.

Demo-Logins (Passwort `demo`): bauer, nord, meier (Zulieferer), nordlicht (Spedition), regnauer, drk (Hilfsorganisation).

## Anpassbar ohne Code
- `backend/config/material-types.json`, `backend/config/parts-criteria.json`
- `backend/recipes/*.py`: `META`, `can_build(inventory)`, `consume_materials(inventory)`; Helfer in `_helpers.py`
- Farben: Variablen am Anfang von `frontend/src/styles.css`
- Logo/Hintergrund: `frontend/public/logo.jpg`, `hero.jpg` ersetzen (Pfad in `--hero-image`)

Badge-Code pro Unternehmen: Scoreboard-Seite, Spalte „Einbetten“. Standort-Marker der Karte: `frontend/src/shelterSites.ts`.

Foto-Erkennung (Zulieferer): `backend/.env.example` nach `backend/.env` kopieren und befüllen (`GEMINI_API_KEY`, optional `GEMINI_MODEL`), dann das Backend neu starten.
