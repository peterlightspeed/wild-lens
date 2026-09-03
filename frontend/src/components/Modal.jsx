import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/* A small, dependency-free modal shell: backdrop + centered dialog, Escape
   to close, body scroll lock. Bootstrap's modal *CSS* classes are reused
   for visuals (.modal, .modal-dialog, .modal-content) but none of its JS
   — this is what the conversion brief calls for ("a modal that wouldn't
   reliably open" was the exact bug we're avoiding by not mixing imperative
   Bootstrap JS into React). */
export default function Modal({ open, onClose, children, dialogClassName = 'modal-dialog-centered' }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal fade show"
      style={{ display: 'block' }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: -1 }}></div>
      <div className={`modal-dialog ${dialogClassName}`}>
        <div
          className="modal-content p-3"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-xl)' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
