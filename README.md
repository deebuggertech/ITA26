# RE:Build Impact

Alpioneers ITA Hackathon 2026 / Regnauer Challenge

    (cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt)
    npm --prefix frontend install

    (cd backend && .venv/bin/python -m app)     # :5172
    npm --prefix frontend run dev -- --host     # :5173

Image recognition: copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`.
