# RE:Build Impact

Alpioneers ITA Hackathon 2026 / Regnauer Challenge

## Setup

    (cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt)
    npm --prefix frontend install

Image recognition (optional): `cp backend/.env.example backend/.env` and set `GEMINI_API_KEY`.
`.env` is gitignored, so on a server copy it over by hand. Without it, photo analysis answers 503.

## Run

    chmod +x start-servers.sh    # once, if the script is not executable
    ./start-servers.sh

Starts the backend on :5172 and the frontend on :5173 (`--host`, reachable from the network).
Logs go to `logs/backend.log` and `logs/frontend.log`.

Stop:

    pkill -f "python -m app"; pkill -f vite

Manual start, in two terminals:

    (cd backend && .venv/bin/python -m app)     # :5172
    npm --prefix frontend run dev -- --host     # :5173

The backend must be started with `python -m app`; bare `uvicorn app.main:app` is rejected because the frontend proxy expects port 5172.
