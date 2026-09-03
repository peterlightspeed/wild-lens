import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '../components/Seo';
import Counter from '../components/Counter';
import SpecimenArt from '../components/SpecimenArt';
import speciesArt from '../data/speciesArt.json';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: 'bi-camera', title: 'AI Identification', text: 'Upload any wildlife photo and our AI instantly identifies the species with detailed facts, habitat, and diet.' },
  { icon: 'bi-journal-bookmark', title: 'Living Encyclopedia', text: 'Browse a curated field guide of species profiles — habitats, conservation status, and behaviour, always growing.' },
  { icon: 'bi-people', title: 'Global Community', text: 'Share sightings, follow trackers around the world, and help map biodiversity one photo at a time.' },
  { icon: 'bi-stars', title: 'AI Studio', text: 'Generate wildlife art, animate stills, remove backgrounds, and upscale your best shots — all in one studio.' },
];

const SPECIES_PREVIEW = [
  { anchor: 'lion', art: 'lion', plate: 'PLATE 01', latin: 'Panthera leo', tone: 'tone-a', name: 'African Lion', status: 'warning', statusIcon: 'bi-exclamation-triangle', statusText: 'Vulnerable' },
  { anchor: 'snow-leopard', art: 'snowLeopard', plate: 'PLATE 02', latin: 'Panthera uncia', tone: 'tone-b', name: 'Snow Leopard', status: 'warning', statusIcon: 'bi-exclamation-triangle', statusText: 'Vulnerable' },
  { anchor: 'blue-morpho', art: 'blueMorpho', plate: 'PLATE 03', latin: 'Morpho peleides', tone: 'tone-c', name: 'Blue Morpho Butterfly', status: 'success', statusIcon: 'bi-check-circle', statusText: 'Least Concern' },
  { anchor: 'red-fox', art: 'redFox', plate: 'PLATE 04', latin: 'Vulpes vulpes', tone: 'tone-d', name: 'Red Fox', status: 'success', statusIcon: 'bi-check-circle', statusText: 'Least Concern' },
];

const RECENT_SIGHTINGS = [
  { art: 'sightingRedFox', tone: 'tone-d', location: 'Yellowstone, USA', name: 'Red Fox', handle: '@WildTracker' },
  { art: 'sightingDeer', tone: 'tone-a', location: 'Ontario, Canada', name: 'White-tailed Deer', handle: '@NatureLens' },
  { art: 'sightingElephant', tone: 'tone-b', location: 'Congo Basin', name: 'Forest Elephant', handle: '@AfricaWild' },
];

export default function Home() {
  const scanRef = useRef(null);

  // Occasionally sweep the hero reticle scan-line — ported verbatim from
  // the inline <script> at the bottom of index.html.
  useEffect(() => {
    const scan = scanRef.current;
    if (!scan) return;
    const sweep = () => {
      scan.classList.add('is-scanning');
      setTimeout(() => scan.classList.remove('is-scanning'), 1900);
    };
    const first = setTimeout(sweep, 1200);
    const interval = setInterval(sweep, 7000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  return (
    <>
      <Seo
        title="WildLens — Discover the Wild World Around You"
        description="Snap a photo, identify any species in seconds. AI-powered wildlife identification, a living encyclopedia, and a global community of nature trackers."
        path="/"
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` }] },
          { '@context': 'https://schema.org', '@type': 'Organization', name: 'WildLens', url: `${SITE_ORIGIN}/`, logo: `${SITE_ORIGIN}/icons/icon-512.png`, description: 'AI-powered wildlife identification, a living species encyclopedia, and a community of naturalists.' },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: 'WildLens', url: `${SITE_ORIGIN}/` },
        ]}
      />

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="container-wl">
          <div className="hero-grid">
            <div data-aos="fade-up">
              <span className="kicker"><span className="dot"></span> AI-Powered Wildlife Discovery</span>
              <h1 className="hero-title" style={{ marginTop: 20 }}>Discover the <em>wild world</em> around you</h1>
              <p className="lede" style={{ maxWidth: 480 }}>Snap a photo, identify any species in seconds. Join a global community of naturalists tracking, sharing, and protecting Earth's most extraordinary creatures.</p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link to="/identify" className="btn-wl btn-primary-wl"><i className="bi bi-camera-fill"></i> Identify Wildlife Now</Link>
                <Link to="/community" className="btn-wl btn-outline-wl"><i className="bi bi-eye"></i> Browse Sightings</Link>
              </div>
              <div className="hero-stats-row">
                <div className="hero-stat-inline"><span className="num"><Counter target={12000} suffix="+" /></span><span className="lbl">Species&nbsp;Identified</span></div>
                <div className="hero-stat-inline"><span className="num"><Counter target={50} suffix="K+" /></span><span className="lbl">Sightings</span></div>
                <div className="hero-stat-inline"><span className="num"><Counter target={98} suffix="%" /></span><span className="lbl">AI&nbsp;Accuracy</span></div>
              </div>
            </div>

            <div className="hero-media" data-aos="fade-up" data-aos-delay="120">
              <div className="hero-media-frame reticle" id="heroFrame">
                <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                <div className="scan-line" ref={scanRef}></div>
                <svg
                  viewBox="0 0 500 620" xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  preserveAspectRatio="xMidYMax slice"
                  dangerouslySetInnerHTML={{ __html: speciesArt.heroDeer }}
                />
              </div>

              <div className="hero-badge-float b1" style={{ top: '8%', left: '-6%' }}>
                <span className="ic"><i className="bi bi-cpu"></i></span>
                <div><div className="title">Species Matched</div><div className="sub">CONF. 97.4%</div></div>
              </div>
              <div className="hero-badge-float b2" style={{ bottom: '10%', right: '-6%' }}>
                <span className="ic"><i className="bi bi-geo-alt"></i></span>
                <div><div className="title">White-tailed Deer</div><div className="sub">ONTARIO, CA</div></div>
              </div>
            </div>
          </div>

          <div className="scroll-indicator"><span>Explore</span><span className="line"></span></div>
        </div>
      </header>

      {/* ============ STAT BAND ============ */}
      <section className="container-wl" style={{ paddingBottom: 0 }}>
        <div className="stat-band" data-aos="fade-up">
          <div className="stat-band-grid">
            <div className="stat-item"><span className="num"><Counter target={12000} suffix="+" /></span><span className="lbl">Species Identified</span></div>
            <div className="stat-item"><span className="num"><Counter target={50} suffix="K+" /></span><span className="lbl">Community Sightings</span></div>
            <div className="stat-item"><span className="num"><Counter target={98} suffix="%" /></span><span className="lbl">AI Accuracy</span></div>
            <div className="stat-item"><span className="num"><Counter target={120} suffix="+" /></span><span className="lbl">Countries Covered</span></div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="section-pad">
        <div className="container-wl">
          <div className="section-head center" data-aos="fade-up">
            <span className="kicker">What's Inside</span>
            <h2>Everything you need to explore wildlife</h2>
            <p>From instant AI identification to a living encyclopedia and a global naturalist community — WildLens brings the wild closer to you.</p>
          </div>
          <div className="row g-4">
            {FEATURES.map((f, i) => (
              <div className="col-12 col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay={i * 80} key={f.title}>
                <div className="feat-card">
                  <div className="feat-icon"><i className={`bi ${f.icon}`}></i></div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SPECIES PREVIEW ============ */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-wl">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3" style={{ marginBottom: 40 }} data-aos="fade-up">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="kicker">Field Guide</span>
              <h2>From the encyclopedia</h2>
              <p>A glimpse of the species catalog — apex predators to delicate pollinators.</p>
            </div>
            <Link to="/encyclopedia" className="btn-wl btn-outline-wl btn-sm-wl">Browse all species <i className="bi bi-arrow-right"></i></Link>
          </div>

          <div className="row g-4">
            {SPECIES_PREVIEW.map((s, i) => (
              <div className="col-12 col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay={i * 80} key={s.anchor}>
                <Link to={`/encyclopedia#${s.anchor}`} className="card-wl d-block text-decoration-none reticle">
                  <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                  <div className={`card-media species-art ${s.tone}`}>
                    <span className="specimen-plate-num">{s.plate}</span>
                    <div className="specimen-latin">{s.latin}</div>
                    <SpecimenArt name={s.art} />
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div><h3>{s.name}</h3><p className="sci-name">{s.latin}</p></div>
                    </div>
                    <span className={`badge-wl badge-${s.status} mt-2`}><i className={`bi ${s.statusIcon}`}></i> {s.statusText}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RECENT SIGHTINGS ============ */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-wl">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3" style={{ marginBottom: 40 }} data-aos="fade-up">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="kicker">Live From the Field</span>
              <h2>Recent sightings</h2>
              <p>Captured by our community around the world, moments ago.</p>
            </div>
            <Link to="/community" className="btn-wl btn-outline-wl btn-sm-wl">See all sightings <i className="bi bi-arrow-right"></i></Link>
          </div>

          <div className="row g-4">
            {RECENT_SIGHTINGS.map((s, i) => (
              <div className="col-12 col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={i * 80} key={s.name + s.location}>
                <div className="card-wl reticle">
                  <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                  <div className={`card-media species-art ${s.tone}`}>
                    <div className="badge-overlay badge-wl badge-neutral"><i className="bi bi-geo-alt-fill"></i> {s.location}</div>
                    <div className="card-actions"><FavoriteButton /></div>
                    <SpecimenArt name={s.art} />
                  </div>
                  <div className="card-body">
                    <h3>{s.name}</h3>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="spec-tag">by {s.handle}</span>
                      <Link to="/community" className="btn-wl btn-ghost-wl btn-sm-wl">View</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-wl">
          <div className="text-center" data-aos="zoom-in" style={{ maxWidth: 640, margin: '0 auto' }}>
            <span className="kicker"><i className="bi bi-unlock"></i> Free to use · No signup required to explore</span>
            <h2 style={{ fontSize: 'clamp(2rem,4.4vw,2.9rem)', margin: '20px 0 14px' }}>Start identifying wildlife today</h2>
            <p className="lede">Take a photo of any animal, bird, or insect. Our AI will identify it instantly and tell you everything about it.</p>
            <Link to="/identify" className="btn-wl btn-primary-wl mt-3"><i className="bi bi-camera-fill"></i> Try the AI Identifier</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FavoriteButton() {
  const { requireAuth } = useAuth();
  return (
    <button
      className="icon-chip"
      aria-label="Save sighting"
      onClick={(e) => {
        if (!requireAuth()) return;
        const icon = e.currentTarget.querySelector('i');
        icon.classList.toggle('bi-heart');
        icon.classList.toggle('bi-heart-fill');
        e.currentTarget.classList.toggle('is-fav');
      }}
    >
      <i className="bi bi-heart"></i>
    </button>
  );
}
