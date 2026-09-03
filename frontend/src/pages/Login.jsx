import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Seo from '../components/Seo';

export default function Login() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const nextUrl = params.get('next') || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      show('Welcome back!');
      setTimeout(() => navigate(nextUrl), 400);
    } catch (err) {
      setError(err.message || 'Could not reach the server. Is the API running?');
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Sign In — WildLens" path="/login" noindex />
      <Link to="/" className="wl-brand top-brand">
        <span className="wl-brand-mark"><i className="bi bi-leaf-fill"></i></span>WildLens
      </Link>

      <div className="auth-shell">
        <div className="auth-card">
          <span className="kicker"><span className="dot"></span> Welcome Back</span>
          <h1 className="mt-3 mb-2" style={{ fontSize: '1.7rem' }}>Sign in to WildLens</h1>
          <p className="mb-4" style={{ fontSize: '0.92rem' }}>Access your saved species, sightings, and AI Studio credits.</p>

          <button type="button" className="social-btn" onClick={() => show('Google sign-in coming soon')}><i className="bi bi-google"></i> Continue with Google</button>
          <button type="button" className="social-btn" onClick={() => show('Apple sign-in coming soon')}><i className="bi bi-apple"></i> Continue with Apple</button>

          <div className="auth-divider">or</div>

          <form onSubmit={onSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email</label>
              <input className="wl-input" type="email" id="email" required autoComplete="email" placeholder="you@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <div className="d-flex justify-content-between align-items-center">
                <label className="field-label mb-0" htmlFor="password">Password</label>
                <a href="#" className="spec-tag" style={{ textDecoration: 'underline' }}
                  onClick={(e) => { e.preventDefault(); show('Password reset coming soon'); }}>Forgot?</a>
              </div>
              <input className="wl-input mt-2" type="password" id="password" required autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="field-error visible">{error}</p>}
            <button type="submit" className="btn-wl btn-primary-wl w-100 mt-2" disabled={busy}>
              <i className={`bi ${busy ? 'bi-arrow-repeat' : 'bi-box-arrow-in-right'}`}></i> {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-4 mb-0" style={{ fontSize: '0.88rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-bright)', fontWeight: 700 }}>Sign up</Link>
          </p>
          <div className="text-center mt-3">
            <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}><i className="bi bi-arrow-left"></i> Continue browsing as a guest</Link>
          </div>
        </div>
      </div>
    </>
  );
}
