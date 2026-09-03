# WildLens API (FastAPI + PostgreSQL)

Backend for the WildLens frontend — authentication, the species encyclopedia,
community sightings, AI identification, and the AI studio. AI provider calls
are stubbed in `app/services/` so the whole stack runs immediately with mock
data; swap those functions for real providers when ready.

## What's real vs. stubbed

- **Real**: signup/login/JWT auth, guest-optional identification endpoint,
  species encyclopedia (DB-backed, seeded), sightings + likes + comments,
  saved items, studio credit accounting.
- **Stubbed** (clearly marked in `app/services/ai_vision.py` and
  `app/services/ai_generation.py`): the actual vision/generation model
  calls. `/api/identify` returns a randomly-picked mock result today so the
  frontend's full flow works with no API key.

## Requires Python 3.10+

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Fastest way to get Postgres + Redis running locally:

```bash
docker compose up -d db redis
```

Or point `DATABASE_URL` in `.env` at a Supabase Postgres connection string —
no code changes needed either way.

## Create tables & seed the encyclopedia

```bash
python -m scripts.seed_species
```

This also creates all tables. Switch to Alembic migrations (scaffolded in
`alembic/`) once the schema needs to evolve without dropping data.

## Run the API

```bash
uvicorn app.main:app --reload
```

Docs at `http://localhost:8000/docs`. Health check at `/health`.

## Connect the frontend

In `js/config.js`:

```js
window.WL_CONFIG = { API_BASE: "http://localhost:8000/api" };
```

and make sure `CORS_ORIGINS` in `.env` includes wherever the frontend is
served from.

## Guest vs. signed-in access

`POST /api/identify`, `GET /api/sightings`, and `GET /api/species` all work
with **no token** — the "explore without signing up" surface. Saving,
posting, liking, commenting, and everything under `/api/studio/*` require a
Bearer token from `POST /api/auth/login`.

## Tests

```bash
pytest
```
