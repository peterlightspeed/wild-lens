import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/* ==========================================================================
   WildLens — Toast
   Same visual behavior as WL.toast() in js/main.js. Exposed two ways:
     1. useToast().show(msg, type) from inside React components
     2. window.dispatchEvent(new CustomEvent('wl-toast', { detail: { msg, type } }))
        for the rare spot (e.g. a plain <form onSubmit>) that's easier to
        wire without importing the hook.
   ========================================================================== */

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((msg, type = 'ok') => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2900);
  }, []);

  useEffect(() => {
    const handler = (e) => show(e.detail?.msg, e.detail?.type);
    window.addEventListener('wl-toast', handler);
    return () => window.removeEventListener('wl-toast', handler);
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const color = toast.type === 'error' ? '#c1503d' : toast.type === 'warn' ? '#d9a441' : '#57b37f';
  return (
    <div
      style={{
        background: '#101c15', border: `1px solid ${color}`, color: '#f3f0e7',
        padding: '12px 20px', borderRadius: 999, fontFamily: 'Manrope,sans-serif',
        fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all .3s cubic-bezier(.22,1,.36,1)', whiteSpace: 'nowrap',
      }}
    >
      {toast.msg}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
