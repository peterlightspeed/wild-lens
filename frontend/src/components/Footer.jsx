export default function Footer() {
  return (
    <footer className="wl-footer">
      <div className="container-wl">
        <div className="row gy-5">
          <div className="col-12 col-lg-4">
            <a href="/" className="wl-brand mb-3 d-inline-flex">
              <span className="wl-brand-mark"><i className="bi bi-leaf-fill"></i></span>WildLens
            </a>
            <p className="mt-3">A field guide for the wild world — instant AI identification, a living encyclopedia, and a community tracking Earth's most extraordinary creatures.</p>
            <div className="social-row">
              <a href="#" className="btn-icon-wl" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#" className="btn-icon-wl" aria-label="X (Twitter)"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="btn-icon-wl" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
              <a href="#" className="btn-icon-wl" aria-label="GitHub"><i className="bi bi-github"></i></a>
            </div>
          </div>
          <div className="col-6 col-lg-2 footer-col">
            <h6>Navigate</h6>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/identify">Identify</a></li>
              <li><a href="/encyclopedia">Encyclopedia</a></li>
              <li><a href="/community">Community</a></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2 footer-col">
            <h6>AI Studio</h6>
            <ul>
              <li><a href="/image-generator">Image Generator</a></li>
              <li><a href="/image-to-video">Image to Video</a></li>
              <li><a href="/image-generator#upscaler">Upscaler</a></li>
              <li><a href="/image-generator#bg-remover">Background Remover</a></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2 footer-col">
            <h6>Resources</h6>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Conservation Partners</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2 footer-col">
            <h6>Stay Updated</h6>
            <p className="mb-2" style={{ fontSize: '0.86rem' }}>Species spotlights, monthly.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="footer-copy">© 2026 WildLens. Helping people connect with nature.</div>
        </div>
        <div className="dev-credit">
          Crafted with <i className="bi bi-heart-fill" style={{ color: '#57b37f' }}></i> by{' '}
          <a href="https://peterlightspeed.github.io/portfolio" target="_blank" rel="noopener noreferrer">Peter Lightspeed</a>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  return (
    <form
      className="newsletter-form"
      onSubmit={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('wl-toast', { detail: { msg: 'Subscribed — welcome to the pack.' } }));
        e.target.reset();
      }}
    >
      <input type="email" required placeholder="you@email.com" aria-label="Email address" />
      <button type="submit" className="btn-icon-wl" style={{ width: 44, height: 44, flexShrink: 0 }} aria-label="Subscribe">
        <i className="bi bi-arrow-right"></i>
      </button>
    </form>
  );
}
