import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavScroll } from '../hooks/useNavScroll';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const navLinkClass = ({ isActive }) => (isActive ? 'active' : undefined);

export default function Navbar({ onOpenDrawer }) {
  const scrolled = useNavScroll();
  const { loggedIn, user, logout, initials } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [studioOpen, setStudioOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const studioRef = useRef(null);
  const accountRef = useRef(null);

  // Close dropdowns on outside click — the behavior Bootstrap's JS used to
  // give us for free, now explicit React state per the conversion brief.
  useEffect(() => {
    const onClick = (e) => {
      if (studioRef.current && !studioRef.current.contains(e.target)) setStudioOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <nav className={`wl-nav${scrolled ? ' is-scrolled' : ''}`} id="wlNav">
      <div className="container-wl">
        <Link to="/" className="wl-brand">
          <span className="wl-brand-mark"><i className="bi bi-leaf-fill"></i></span>
          WildLens
        </Link>
        <ul className="wl-links">
          <li><NavLink to="/" end className={navLinkClass}>Home</NavLink></li>
          <li><NavLink to="/identify" className={navLinkClass}><i className="bi bi-camera"></i> Identify</NavLink></li>
          <li><NavLink to="/encyclopedia" className={navLinkClass}><i className="bi bi-journal-bookmark"></i> Encyclopedia</NavLink></li>
          <li><NavLink to="/community" className={navLinkClass}><i className="bi bi-people"></i> Community</NavLink></li>
          <li className={`dropdown${studioOpen ? ' show' : ''}`} ref={studioRef}>
            <a
              href="#"
              className="dropdown-toggle"
              aria-expanded={studioOpen}
              onClick={(e) => { e.preventDefault(); setStudioOpen((v) => !v); }}
            >
              <i className="bi bi-stars"></i> Studio
            </a>
            <ul className={`dropdown-menu wl-dropdown-menu${studioOpen ? ' show' : ''}`}>
              <li><Link className="dropdown-item" to="/image-generator" onClick={() => setStudioOpen(false)}><i className="bi bi-image"></i> Image Generator</Link></li>
              <li><Link className="dropdown-item" to="/image-to-video" onClick={() => setStudioOpen(false)}><i className="bi bi-film"></i> Image to Video</Link></li>
            </ul>
          </li>
        </ul>
        <div className="wl-nav-actions">
          {canInstall && (
            <button className="btn-wl btn-outline-wl btn-sm-wl d-none d-md-inline-flex" onClick={promptInstall} aria-label="Install WildLens app">
              <i className="bi bi-download"></i> Install
            </button>
          )}
          <Link to="/identify" className="btn-wl btn-primary-wl btn-sm-wl d-none d-md-inline-flex">
            <i className="bi bi-camera"></i> Identify Now
          </Link>
          {!loggedIn && (
            <Link to="/login" className="btn-wl btn-ghost-wl btn-sm-wl d-none d-md-inline-flex">
              <i className="bi bi-box-arrow-in-right"></i> Sign In
            </Link>
          )}
          {loggedIn && (
            <div className={`dropdown d-none d-md-block${accountOpen ? ' show' : ''}`} ref={accountRef}>
              <button
                className="btn-icon-wl"
                aria-expanded={accountOpen}
                aria-label="Account menu"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem' }}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span>{initials()}</span>
              </button>
              <ul className={`dropdown-menu wl-dropdown-menu dropdown-menu-end${accountOpen ? ' show' : ''}`}>
                <li className="px-3 py-2"><div className="text-ink fw-bold" style={{ fontSize: '0.85rem' }}>{user?.full_name || '-'}</div></li>
                <li><hr className="dropdown-divider" style={{ borderColor: 'var(--line)' }} /></li>
                <li><button className="dropdown-item" type="button" onClick={() => { logout(); setAccountOpen(false); }}><i className="bi bi-box-arrow-right"></i> Sign Out</button></li>
              </ul>
            </div>
          )}
          <button className="wl-burger" aria-label="Open menu" aria-expanded="false" onClick={onOpenDrawer}>
            <span className="bi bi-list"></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
