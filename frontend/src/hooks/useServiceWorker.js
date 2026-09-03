import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

/* Replaces initServiceWorker() in js/main.js. vite-plugin-pwa generates the
   service worker at build time (see vite.config.js) and this virtual
   module registers it — same "fail silently, it's a progressive
   enhancement" behavior as the original. */
let registered = false;

export function useServiceWorker() {
  useEffect(() => {
    if (registered) return;
    registered = true;
    try {
      registerSW({ immediate: true, onRegisterError: () => {} });
    } catch {
      // no-op — offline support is a progressive enhancement
    }
  }, []);
}
