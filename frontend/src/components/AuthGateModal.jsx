import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

export default function AuthGateModal() {
  const { gateOpen, closeGate } = useAuth();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  return (
    <Modal open={gateOpen} onClose={closeGate}>
      <div className="modal-body text-center py-4">
        <div className="dropzone-icon mx-auto" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
          <i className="bi bi-person-lock"></i>
        </div>
        <h3 className="mt-3 mb-2" style={{ fontSize: '1.3rem' }}>Sign in to continue</h3>
        <p className="mb-4">Create a free account to save results, post sightings, and use the AI Studio. Identifying and browsing stay free, no account needed.</p>
        <div className="d-flex flex-column gap-2">
          <Link to={`/login?next=${next}`} className="btn-wl btn-primary-wl w-100" onClick={closeGate}>
            <i className="bi bi-box-arrow-in-right"></i> Sign In
          </Link>
          <Link to={`/signup?next=${next}`} className="btn-wl btn-outline-wl w-100" onClick={closeGate}>
            <i className="bi bi-person-plus"></i> Create Account
          </Link>
          <button className="btn-wl btn-ghost-wl w-100" onClick={closeGate}>Not now</button>
        </div>
      </div>
    </Modal>
  );
}
