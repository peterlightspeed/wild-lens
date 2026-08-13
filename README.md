# WildLens

AI-powered wildlife identification, a living species encyclopedia, a community
sightings feed, and an AI creative studio — built as a installable Progressive
Web App. This is the **UI/UX phase**: everything is static HTML/CSS/JS with
simulated AI responses, structured to drop a real backend in later without
redesigning anything.

## Tech

Bootstrap 5.3, vanilla ES6, AOS scroll animations, and a custom design system
(`css/style.css`). No build step — it's plain static files.

## Run it locally

Just serve the folder over HTTP (the service worker won't register over
`file://`):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → pick
   `main` and `/ (root)` → **Save**.
3. Your site will be live at `https://<username>.github.io/<repo>/` within a
   minute or two.

All asset paths in this project are **relative** (`css/style.css`,
`js/main.js`, etc.), so it works correctly whether it's served from a domain
root or a GitHub Pages project subpath — no config changes needed.

## PWA notes

- `manifest.json` — install metadata, icons, and shortcuts (Identify /
  Encyclopedia / Community).
- `sw.js` — service worker. Precaches the app shell on first visit;
  previously-visited pages keep working offline. Falls back to
  `offline.html` for uncached navigations.
- `icons/` — app icons (192/512, plus maskable variants for Android's
  adaptive-icon masking) and the Apple touch icon.
- An **Install** button appears in the navbar/drawer automatically once the
  browser fires `beforeinstallprompt` (Chrome/Edge/Android). iOS Safari has
  no install prompt API — users add it via Share → "Add to Home Screen",
  which the `apple-mobile-web-app-*` meta tags and touch icon already support.

**If you ship changes to CSS/JS/HTML**, bump `CACHE_VERSION` at the top of
`sw.js` — otherwise returning visitors' browsers will keep serving the old
cached files.

## Structure

```
index.html              Home
identify.html            AI Wildlife Identifier (flagship)
encyclopedia.html        Species field guide
community.html           Sightings feed
image-generator.html     AI Studio — generate / remove background / upscale
image-to-video.html      AI Studio — animate a still into a clip
css/style.css            Design system (tokens, components)
js/main.js               Shared behavior (nav, drawer, counters, PWA install/SW)
manifest.json, sw.js, offline.html, icons/, favicon.ico   PWA
```

## Wiring up the real backend later

Every simulated flow (identification, generation, sightings) is isolated in
each page's inline `<script>` — swap the `setTimeout(...)` demo logic for a
`fetch()` call to your FastAPI/Flask endpoint and the UI (loading states,
result rendering, error toasts via `WL.toast()`) needs no other changes.

---
Crafted by [Peter Lightspeed](https://peterlight123.github.io/portfolio)
