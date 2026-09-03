import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Set BASE_PATH in the build environment when deploying to a GitHub Pages
// *project* page (e.g. https://you.github.io/wildlens/ -> BASE_PATH=/wildlens/).
// Leave it unset (defaults to '/') for a custom domain, a GitHub Pages
// *user* site, or Vercel/Netlify. See ../.github/workflows/deploy.yml.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'offline.html', 'icons/*.png'],
      manifest: {
        name: 'WildLens — AI Wildlife Identifier',
        short_name: 'WildLens',
        description:
          'Snap a photo, identify any species in seconds. AI-powered wildlife identification, a living encyclopedia, and a global community of naturalists.',
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        background_color: '#0a0f0b',
        theme_color: '#0a0f0b',
        lang: 'en',
        dir: 'ltr',
        categories: ['nature', 'education', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Identify Wildlife', short_name: 'Identify', description: 'Upload or capture a photo to identify a species', url: 'identify', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Encyclopedia', short_name: 'Encyclopedia', description: 'Browse the species field guide', url: 'encyclopedia', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Community', short_name: 'Community', description: 'See recent sightings from the community', url: 'community', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Network-first for navigations (falls back to offline.html when
        // offline), cache-first for the rest — same strategy as the
        // original hand-rolled sw.js.
        navigateFallback: 'offline.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'wildlens-pages' },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:png|jpg|jpeg|svg|ico)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'wildlens-images' },
          },
          {
            urlPattern: ({ sameOrigin }) => !sameOrigin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'wildlens-cdn' },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
