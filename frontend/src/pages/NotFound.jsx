import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="container-wl text-center" style={{ padding: '120px 20px' }}>
      <Seo title="Page Not Found — WildLens" path="/404" noindex />
      <span className="kicker"><span className="dot"></span> 404</span>
      <h1 className="mt-3">This trail goes cold</h1>
      <p className="lede mx-auto" style={{ maxWidth: 460 }}>The page you're looking for doesn't exist, or has moved.</p>
      <Link to="/" className="btn-wl btn-primary-wl mt-3"><i className="bi bi-house"></i> Back to Home</Link>
    </div>
  );
}
