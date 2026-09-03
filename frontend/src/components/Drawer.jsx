import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const navLinkClass = ({ isActive }) => (isActive ? 'active' : undefined);

export default function Drawer({ open, onClose }) {
  const { loggedIn, user, logout, initials } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();

  // Body scroll lock + Escape-to-close, same as initDrawer() in js/main.js
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`wl-drawer${open ? ' open' : ''}`}>
      <div className="wl-drawer-backdrop" onClick={onClose}></div>
      <div className="wl-drawer-panel">
        <div className="wl-drawer-head">
          <Link to="/" className="wl-brand" onClick={onClose}>
            <span className="wl-brand-mark"><i className="bi bi-leaf-fill"></i></span>WildLens
          </Link>
          <button className="wl-burger" aria-label="Close menu" onClick={onClose}>
            <span className="bi bi-x-lg"></span>
          </button>
        </div>
        <nav>
          <NavLink to="/" end className={navLinkClass} onClick={onClose}><i className="bi bi-house"></i> Home</NavLink>
          <NavLink to="/identify" className={navLinkClass} onClick={onClose}><i className="bi bi-camera"></i> Identify</NavLink>
          <NavLink to="/community" className={navLinkClass} onClick={onClose}><i className="bi bi-people"></i> Community</NavLink>
          <NavLink to="/encyclopedia" className={navLinkClass} onClick={onClose}><i className="bi bi-journal-bookmark"></i> Encyclopedia</NavLink>
          <div className="wl-drawer-label">Studio</div>
          <NavLink to="/image-generator" className={navLinkClass} onClick={onClose}><i className="bi bi-image"></i> Image Generator</NavLink>
          <NavLink to="/image-to-video" className={navLinkClass} onClick={onClose}><i className="bi bi-film"></i> Image-to-Video</NavLink>
        </nav>
        <div className="mt-auto pt-4 d-flex flex-column gap-2">
          {canInstall && (
            <button className="btn-wl btn-outline-wl w-100" onClick={promptInstall} aria-label="Install WildLens app">
              <i className="bi bi-download"></i> Install App
            </button>
          )}
          {!loggedIn && (
            <Link to="/login" className="btn-wl btn-outline-wl w-100" onClick={onClose}>
              <i className="bi bi-box-arrow-in-right"></i> Sign In
            </Link>
          )}
          {loggedIn && (
            <div className="d-flex align-items-center justify-content-between gap-2 px-2 py-2" style={{ border: '1px solid var(--line-strong)', borderRadius: 'var(--r-md)' }}>
              <div className="d-flex align-items-center gap-2">
                <span className="avatar-ring" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{initials()}</span>
                <span className="text-ink" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.full_name || '-'}</span>
              </div>
              <button className="btn-icon-wl" style={{ width: 34, height: 34 }} aria-label="Sign out" onClick={() => { logout(); onClose(); }}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          )}
          <Link to="/identify" className="btn-wl btn-primary-wl w-100" onClick={onClose}>
            <i className="bi bi-camera"></i> Identify Wildlife
          </Link>
        </div>
      </div>
    </div>
  );
}
