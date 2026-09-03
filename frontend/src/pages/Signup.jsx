import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Seo from '../components/Seo';

export default function Signup() {
  const { signup } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const nextUrl = params.get('next') || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }
    setBusy(true);
    try {
      await signup(fullName.trim(), email.trim(), password);
      show('Welcome to WildLens!');
      setTimeout(() => navigate(nextUrl), 400);
    } catch (err) {
      setError(err.message || 'Could not reach the server. Is the API running?');
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Sign Up — WildLens" path="/signup" noindex />
      <Link to="/" className="wl-brand top-brand">
        <span className="wl-brand-mark"><i className="bi bi-leaf-fill"></i></span>WildLens
      </Link>

      <div className="auth-shell">
        <div className="auth-card">
          <span className="kicker"><span className="dot"></span> Join WildLens</span>
          <h1 className="mt-3 mb-2" style={{ fontSize: '1.7rem' }}>Create your account</h1>
          <p className="mb-4" style={{ fontSize: '0.92rem' }}>Free forever. Save identifications, post sightings, and get 50 AI Studio credits a month.</p>

          <button type="button" className="social-btn" onClick={() => show('Google sign-in coming soon')}><i className="bi bi-google"></i> Continue with Google</button>
          <button type="button" className="social-btn" onClick={() => show('Apple sign-in coming soon')}><i className="bi bi-apple"></i> Continue with Apple</button>

          <div className="auth-divider">or</div>

          <form onSubmit={onSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="fullName">Full name</label>
              <input className="wl-input" type="text" id="fullName" required autoComplete="name" placeholder="Jane Naturalist"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email</label>
              <input className="wl-input" type="email" id="email" required autoComplete="email" placeholder="you@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <input className="wl-input" type="password" id="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="terms" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <label className="form-check-label" htmlFor="terms" style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                I agree to the <a href="#" style={{ color: 'var(--accent-bright)' }}>Terms</a> and <a href="#" style={{ color: 'var(--accent-bright)' }}>Privacy Policy</a>
              </label>
            </div>
            {error && <p className="field-error visible">{error}</p>}
            <button type="submit" className="btn-wl btn-primary-wl w-100 mt-1" disabled={busy}>
              <i className={`bi ${busy ? 'bi-arrow-repeat' : 'bi-person-plus'}`}></i> {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-4 mb-0" style={{ fontSize: '0.88rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-bright)', fontWeight: 700 }}>Sign in</Link>
          </p>
          <div className="text-center mt-3">
            <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}><i className="bi bi-arrow-left"></i> Continue browsing as a guest</Link>
          </div>
        </div>
      </div>
    </>
  );
}
