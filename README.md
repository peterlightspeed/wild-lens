# WildLens

AI-powered wildlife identification, a living species encyclopedia, a
community sightings feed, an AI creative studio, and an "Ask WildLens" AI
chat assistant — a React 18 + Vite single-page app backed by a FastAPI
service with a multi-provider AI fallback chain.

This repo went through a full conversion: the original project was a
no-build static HTML/CSS/vanilla-JS site (still kept for reference in
`legacy-static/`). It's now a proper React app in `frontend/`, plus a new
chat feature and a provider-fallback system in `backend/`. If you're the
second person picking this up, read this file top to bottom — it's written
for you.

```
frontend/     React 18 + Vite + React Router — the whole UI
backend/      FastAPI — auth, species, sightings, studio, chat, identify
legacy-static/  The original static site, kept for reference/diffing
.github/workflows/deploy.yml   Builds frontend/ and deploys to GitHub Pages
```

## Quick start

**Backend** (see `backend/README.md` for full detail):
```bash
cd backend
cp .env.example .env        # fill in DB creds + provider keys (see below)
pip install -r requirements.txt
alembic upgrade head         # or however this repo's migrations are run
uvicorn app.main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
cp .env.example .env         # VITE_API_BASE defaults to localhost:8000/api
npm install
npm run dev                  # http://localhost:5173
```

## What changed — Part 1: React conversion

- **Stack**: React 18, Vite, React Router v6, JavaScript (not TS — no strong
  reason surfaced to prefer it, per the brief's own tie-breaker).
- **`css/style.css` reused as-is** — copied verbatim to
  `frontend/src/styles/style.css` and imported globally in `main.jsx`. Every
  component is built against the existing classes and CSS variables. Nothing
  was ported to CSS-in-JS or Tailwind.
- **No Bootstrap JS.** `bootstrap.bundle.js` is not loaded anywhere — only
  Bootstrap's CSS (via CDN in `index.html`, for grid/utility classes) and
  Bootstrap Icons. Every interactive piece that used to be a Bootstrap
  component (navbar dropdown, mobile drawer, all modals, tabs, the
  before/after slider) is a real React component driven by `useState`. This
  is exactly the "modal that wouldn't reliably open" bug class the brief
  called out, and it's structurally impossible now — there's no imperative
  DOM manipulation racing against React's render.
- **Auth**: `src/context/AuthContext.jsx` is a line-by-line port of the old
  `js/auth.js` — same token-in-`localStorage` model, same
  `login()`/`signup()`/`logout()`, same cached user info, same
  `requireAuth(callback)` gate opening an `<AuthGateModal>` for guests. It
  calls the exact same FastAPI endpoints (`/api/auth/signup`, `/login`,
  `/me`) — the backend's auth contract was not touched.
- **Routing**: one route per page at the same URLs as before
  (`/identify`, `/encyclopedia`, `/community`, `/image-generator`,
  `/image-to-video`, `/login`, `/signup`), plus the new `/chat`. `sitemap.xml`
  and `robots.txt` were updated to match (no more `.html` — see below).
- **SEO**: `src/components/Seo.jsx` uses `react-helmet-async` to set
  per-route `<title>`, meta description, canonical URL, robots, and JSON-LD,
  matching what each static page had. **Known trade-off, stated plainly**:
  this is client-rendered SEO — a crawler that doesn't execute JS sees an
  empty shell on first paint. No prerendering step was added (a
  `vite-plugin-ssg` or custom prerender script is the natural next step if
  search ranking on the public pages matters more than shipping now — the
  routes and Seo component are already structured to make that a
  build-config change, not a rewrite). Google's crawler does execute JS, so
  this mainly affects other bots/crawlers and social-link unfurling in some
  clients.
- **PWA**: `vite-plugin-pwa` regenerates the manifest and service worker
  from the Vite build output (see `vite.config.js`) — same icons, same
  install metadata and shortcuts, same network-first-for-pages /
  cache-first-for-images strategy the hand-rolled `sw.js` used.
  `useServiceWorker.js` replaces the old inline registration script.
  **Not independently verified in this environment** (no real browser to
  test "Add to Home Screen" against) — check this for real on Chrome/Android
  and Safari/iOS before considering it done; see the checklist below.
- **Deployment**: `.github/workflows/deploy.yml` builds `frontend/` and
  publishes `dist/` to GitHub Pages via `actions/deploy-pages` — replacing
  the old "push static files straight to the branch" approach, since a
  Vite app needs a build step first. Set the `BASE_PATH` build env
  (already wired in the workflow) to `/<repo-name>/` for a project page.
  **Vercel/Netlify would be simpler** if you don't specifically need GitHub
  Pages — both auto-detect Vite with zero config; this wasn't set up here
  since Pages was the existing deploy target and switching platforms wasn't
  clearly asked for.

## What changed — Part 2: Ask WildLens (chat)

- **UI**: a floating chat bubble bottom-right, site-wide (mounted in
  `Layout.jsx`, hidden on `/chat` itself to avoid a duplicate), matching the
  reticle/field-guide design language — see `src/styles/chat.css`. A
  dedicated `/chat` page also exists for mobile and deep-linking, sharing
  the same `<ChatConversation>` component as the bubble so there's exactly
  one place the message-list/input logic lives.
- **Guest-accessible**, matching the site's philosophy, with a **lower daily
  cap for guests** (`GUEST_DAILY_CHAT_LIMIT=15`) than logged-in users
  (`USER_DAILY_CHAT_LIMIT=100`) — see `backend/app/services/rate_limit.py`.
- **Backend-driven.** The frontend calls `POST /api/chat` and never talks to
  Groq/Gemini/OpenRouter directly, never holds a provider API key.

## What changed — Part 3: Multi-provider AI fallback (backend)

- `backend/app/services/providers/base.py` defines the provider-agnostic
  `ChatProvider` / `VisionProvider` Protocols (`send()` / `identify()`) plus
  `ProviderError` and its subclasses.
- `chat_providers.py` and `vision_providers.py` implement adapters for
  **Groq**, **Google Gemini**, and **OpenRouter** (chat only), each reading
  its key from its own `.env` var and raising `ProviderError` on
  timeout/rate-limit/failure. A `Mock*Provider` is last in both chains so
  the app runs end-to-end with zero keys configured (verified — see
  Testing below).
- `ai_chat.py` / `ai_vision.py` are the orchestrators: try each provider in
  `PROVIDER_CHAIN` / `VISION_PROVIDER_CHAIN` in order, catch `ProviderError`,
  fall through, only raise to the caller if every provider fails. Which
  provider actually served a response is logged (`chat served by
  provider=groq`) and stored per-message in the new `chat_messages` table
  for later cost/debugging review — never exposed to the end user.
- **Swapping to a single paid, fine-tuned model later is a one-line
  change**: write one adapter implementing `ChatProvider` (or
  `VisionProvider`), then set `PROVIDER_CHAIN = [YourFineTunedProvider()]`.
  Nothing in the routers, schemas, or frontend needs to change — they only
  ever call `get_chat_response()` / `identify()`.
- `ai_vision.py` (previously a hardcoded mock) now runs the same
  fallback-chain pattern for `POST /api/identify`, with the original mock
  kept as the final fallback.
- **Verify current free-tier pricing/limits yourself** before relying on
  these in production — the brief explicitly flags that these change often,
  and this was written from documentation, not a live account.

**Provider API keys to verify and obtain**: `GROQ_API_KEY`, `GEMINI_API_KEY`,
`OPENROUTER_API_KEY` — see `backend/.env.example`. None are required for the
app to run (mock fallback covers that), but chat/identify won't produce real
answers until at least one is set.

## Testing done in this environment

No real browser or Postgres instance was available here, so testing split
into what could be verified directly and what needs a real check by whoever
deploys this:

**Verified:**
- `cd frontend && npm run build` — clean build, no errors (Vite 5, 85
  modules, PWA manifest + service worker generated).
- `npm run preview` served the built `dist/` — root path and a client-side
  route (`/identify`) both return the SPA shell with HTTP 200; static
  assets (manifest, icons) resolve.
- Backend: `python -c "import app.main"` — the full FastAPI app imports
  cleanly and every route registers, including the new `POST /api/chat`.
- `ai_chat.get_chat_response()` and `ai_vision.identify()` were run directly
  with zero provider keys set — both correctly fall through the whole
  chain to their mock provider and return a valid response.
- `rate_limit.check_and_increment()` was run directly — correctly allows up
  to the limit then blocks, using the in-memory fallback (no Redis running
  in this sandbox).
- `backend/tests/test_chat.py` was added (guest access + validation), in
  the same style as the existing `test_auth.py`.

**Not verified here — needs a real check before calling this done:**
- Running the backend against a real Postgres instance (this sandbox had no
  DB server). The chat schema (`UUID` columns) follows the exact pattern of
  the existing `sighting.py`/`user.py` models, so it should behave
  identically, but hasn't been run against real Postgres.
- "Add to Home Screen" on an actual Chrome/Android and Safari/iOS device.
- A real provider key actually returning a real chat/identify response
  (only the mock path was exercised — no API keys were available here).
- Visual/pixel comparison against the original static pages in a real
  browser — the conversion followed the original markup and CSS classes
  closely and the build compiles clean, but no human or automated visual
  diff was run.

## Final checklist (per the conversion brief)

- [x] Every existing page/route exists in the React app at the same URL
- [x] Auth gating: guests can identify/browse/chat with limits; full access
      requires login — same `requireAuth()` gate pattern as before
- [x] PWA manifest + service worker generated by `vite-plugin-pwa` —
      **installability not device-tested, see above**
- [x] SEO tags present per route via `react-helmet-async` — **client-rendered
      limitation stated above, not silently dropped**
- [ ] No console errors — **needs a real browser check**; the build is
      clean but this wasn't run in an actual browser session
- [x] `POST /api/chat` — new, guest-accessible, rate-limited, backend-only
      provider calls
- [x] Multi-provider fallback chain for both chat and identify, with a
      one-line swap path to a single fine-tuned model later

## Before going live

1. Fill in real values for `SITE_ORIGIN` in `frontend/src/components/Seo.jsx`
   and the `YOUR-USERNAME` placeholders in `frontend/public/sitemap.xml` /
   `robots.txt`.
2. Set at least one of `GROQ_API_KEY` / `GEMINI_API_KEY` /
   `OPENROUTER_API_KEY` in `backend/.env` so chat/identify give real answers
   instead of the mock.
3. Set `VITE_API_BASE` (frontend) to your deployed backend's URL, and
   `VITE_API_BASE` as a GitHub Actions repo/environment variable so the
   Pages build points at it.
4. Run Redis in production (`REDIS_URL` — already in `docker-compose.yml`)
   so chat rate limits are shared across backend workers instead of falling
   back to the in-memory, per-process limiter.
