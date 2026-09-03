import { useEffect } from 'react';

/* Mirrors initRipple() in js/main.js — delegated at document level so it
   works on every .btn-wl regardless of which page/component rendered it,
   with no per-button wiring needed. */
export function useRipple() {
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('.btn-wl');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const span = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      span.className = 'ripple';
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(span);
      setTimeout(() => span.remove(), 650);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}
