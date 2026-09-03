import { useEffect, useState } from 'react';

/* Mirrors initInstallPrompt() in js/main.js: captures beforeinstallprompt,
   exposes { canInstall, promptInstall }. Any number of Install buttons
   across the app (navbar, drawer) can share this via useInstallPrompt(). */
let deferredPrompt = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((l) => l(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l(false));
    window.dispatchEvent(new CustomEvent('wl-toast', { detail: { msg: 'WildLens installed — find it on your home screen' } }));
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  useEffect(() => {
    listeners.add(setCanInstall);
    return () => listeners.delete(setCanInstall);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
  };

  return { canInstall, promptInstall };
}
