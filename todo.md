# WildLens — my TODO before this goes live

Fixed already, don't need to touch:
- [x] Footer credit link typo (peterlight123 → peterlightspeed) — fixed in
      both `frontend/` and `legacy-static/`
- [x] `.env.example` comments clarified (SECRET_KEY generation command,
      what CORS_ORIGINS/DATABASE_URL actually need, which vars are dead)
- [x] Real domain wired in everywhere (repo is `wild-lens`, hyphenated —
      GitHub Pages URL is `peterlightspeed.github.io/wild-lens`):
      `Seo.jsx` SITE_ORIGIN, `sitemap.xml`, `robots.txt`, `CORS_ORIGINS`,
      and `BASE_PATH` in the deploy workflow

---

## 🔴 Blocking — site won't work correctly without these

- [ ] **Confirm the repo name really is `wild-lens`** (hyphenated) on
      GitHub — that's what `BASE_PATH: /wild-lens/` in
      `.github/workflows/deploy.yml` now assumes, matching the URL bar in
      your screenshot. If you ever rename the repo, this breaks (assets
      404) until `BASE_PATH` is updated to match. (not just in
      `.env` — the deploy workflow reads it from
      `Settings → Secrets and variables → Actions → Variables`, and it
      won't exist until I add it there manually). Point it at wherever I
      end up hosting the backend.

- [ ] **Generate a real `SECRET_KEY`** for `backend/.env` — run
      `openssl rand -hex 32` and paste the result. Don't ship the
      placeholder value from `.env.example`.

- [ ] **Point `DATABASE_URL` at my real Postgres**, once I know where it's
      hosted (Docker Compose default only works for local dev).

---

## 🟡 Needed for chat/identify to give real answers (not the mock)

- [ ] Get at least one of these and drop it in `backend/.env`:
  - [ ] `GROQ_API_KEY`
  - [ ] `GEMINI_API_KEY`
  - [ ] `OPENROUTER_API_KEY`
  (Verify current free-tier limits before picking — they change often, per
  Claude's earlier note.)
- [ ] Decide: self-host SpeciesNet/BioCLIP on a DigitalOcean droplet later
      instead of/alongside the hosted API chain? (Lateef's suggestion —
      not blocking, just a later architecture decision if the free-tier
      APIs turn out too rate-limited.)

---

## 🟢 Cleanup — my call, not urgent

- [ ] Decide whether to delete `VISION_API_KEY` / `IMAGE_GEN_API_KEY` /
      `VIDEO_GEN_API_KEY` from `backend/.env.example` and
      `backend/app/core/config.py` — confirmed dead, nothing reads them.
- [ ] Fill in real Cloudinary creds in `backend/.env`, or leave blank if
      I'm not doing image uploads for sightings/studio yet.
- [ ] Replace placeholder social links in `Footer.jsx` (Instagram/X/
      YouTube/GitHub currently all point to `#`).
- [ ] Decide what to do with the footer's "Help Center / API Docs /
      Conservation Partners / Contact" links — currently all `#`.
- [ ] Google/Apple sign-in buttons on Login/Signup currently just toast
      "coming soon" — decide if/when to actually wire these up.
- [ ] "Forgot password" on Login also just toasts — same deal.

---

## 🔵 Should actually test in a real browser before calling this done

- [ ] Click through every page on a real device/browser, check console for
      errors (only verified via `npm run build` succeeding — never opened
      in an actual browser session).
- [ ] Test "Add to Home Screen" on Chrome/Android and Safari/iOS.
- [ ] Spin up Postgres for real and run the backend against it (only
      tested with imports/mocks in the sandbox, no live DB).
- [ ] Run Redis in production so chat rate limits are shared across
      workers (`REDIS_URL` already in `docker-compose.yml` — just needs to
      actually be running wherever this deploys).
