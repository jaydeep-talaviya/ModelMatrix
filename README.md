# ModelMatrix

Tree-based LLM parameter comparison — send one prompt to many provider/model/effort combinations in parallel, and compare latency, token cost, and output side by side.

**Live demo:** https://modelmatrix-gold.vercel.app
**API:** https://modelmatrix-api.vercel.app (`/api/health`, `/api/options`, `/api/runs`)

## What it does

- Pick a **provider** (OpenAI, Gemini, Anthropic), **model**, **effort level**, and **structured output** on/off — each combination becomes a leaf in the comparison tree.
- One prompt runs against **all selected leaves in parallel** (async I/O with per-provider concurrency caps).
- Results show output content, status, and metrics: **latency (ms)**, **token usage**, and a **cost estimate ($)** based on per-provider pricing.
- A **Compare** section calls out the longest/largest response and the cheapest option with neutral "observation" labels, plus model context-window tooltips.
- Per-provider **model search**, and results can be **exported as Markdown or CSV**.

> Zero-cost demo: OpenAI and Anthropic run through the [Puter](https://puter.com) free tier (`/drivers/call`) instead of a paid API key; Gemini runs through the official SDK with a free-tier or demo key. See [Env vars](#env-vars).

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS 4 |
| Backend | FastAPI (async), pydantic-settings, httpx |
| Test | pytest (`backend`), backend hosts all provider adapters |

## Repository layout

```
backend/          FastAPI app (providers, runner, schemas, tests)
  app/
    core/         experiment tree expansion, runner, model discovery, labels, pricing
    providers/    openai / gemini / anthropic adapters + Puter fallback mixin
    api/          routers (/api/options, /api/runs, /api/health)
    config.py     pydantic-settings (env vars, see .env.example)
  tests/          pytest suite
frontend/         Vite + React app
  src/lib/        api client, pricing, labels, markdown/csv export
  src/components/ ConfigurationTree, ProviderSection, ResultsPanel, Compare, ...
```

## Run locally

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # then fill in keys/token (see below)
uvicorn app.main:app --reload --port 8001
```

The API is available at `http://127.0.0.1:8001` (docs at `/docs`).

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to `http://127.0.0.1:8001`, so no config is needed locally.

### Tests

```bash
cd backend && source .venv/bin/activate && python -m pytest -q
```

## Env vars

Set in `backend/.env` (see `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Used when OpenAI is **not** routed through Puter |
| `GEMINI_API_KEY` | Used for Gemini native calls |
| `ANTHROPIC_API_KEY` | Used when Anthropic is **not** routed through Puter |
| `PUTER_AUTH_TOKEN` | Free token from [puter.com/dashboard](https://puter.com/dashboard) for the Puter free tier |
| `PROVIDER_USING_PUTER` | Comma-separated providers forced through Puter even if their own key is set, e.g. `openai,anthropic` |
| `CORS_ORIGINS` | JSON list of allowed origins (defaults to localhost) |
| `PUTER_MAX_CONCURRENCY` / `PUTER_MAX_RETRIES` / `PUTER_RETRY_BACKOFF_S` | Puter free-tier throttling guard (defaults: `2`, `3`, `1.0`) |

> ⚠️ Never commit `.env` — it is gitignored.

## Deployment (Vercel)

Two projects from this repo (see `backend/vercel.json` + `backend/api/index.py` for the API side):

1. **API** → root directory `backend` (FastAPI auto-detected). Set the env vars above, plus `CORS_ORIGINS=["https://<frontend-url>"]`.
2. **Frontend** → root directory `frontend`. Set `VITE_API_BASE=https://<api-url>/` (without `/api` — the app appends it). A committed `frontend/.env.production` already pins the live API URL.