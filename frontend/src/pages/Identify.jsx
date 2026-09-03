import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';

const STATUS_STEPS = [
  { t: 0, label: 'DETECTING SUBJECT…' },
  { t: 30, label: 'MATCHING SPECIES DATABASE…' },
  { t: 60, label: 'CROSS-REFERENCING HABITAT DATA…' },
  { t: 85, label: 'FINALIZING RESULT…' },
];

const RECENT_KEY = 'wl_recent';

export default function Identify() {
  const [stage, setStage] = useState('upload'); // upload | analyzing | result
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState(STATUS_STEPS[0].label);
  const [result, setResult] = useState(null);
  const [confDisplay, setConfDisplay] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recent, setRecent] = useState([]);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const progressTimerRef = useRef(null);
  const { requireAuth } = useAuth();
  const { show } = useToast();

  useEffect(() => { loadRecent(); }, []);

  function loadRecent() {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
    } catch {
      setRecent([]);
    }
  }

  function saveToRecent(sp) {
    try {
      const list = [{ name: sp.predicted_species, sci: sp.scientific_name }, ...recent].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
      setRecent(list);
    } catch { /* localStorage unavailable — non-fatal */ }
  }

  // Drives the STAGE 2 progress bar/status copy while the real
  // POST /api/identify request is in flight — same visual pacing as the
  // original (fake, evenly-stepped) progress, but now actually gated on a
  // real network call rather than a fixed setInterval.
  function startFakeProgress() {
    setProgress(0);
    setStatusLabel(STATUS_STEPS[0].label);
    let p = 0;
    progressTimerRef.current = setInterval(() => {
      // Ease toward 90% and hold — the real jump to 100% happens when the
      // API response actually lands, in identifyFile() below.
      p += Math.random() * 6 + 3;
      if (p > 90) p = 90;
      setProgress(p);
      const current = [...STATUS_STEPS].reverse().find((s) => p >= s.t) || STATUS_STEPS[0];
      setStatusLabel(current.label);
    }, 320);
  }

  function stopFakeProgress() {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = null;
  }

  async function identifyFile(file) {
    setStage('analyzing');
    startFakeProgress();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/identify', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Identification failed');
      setProgress(100);
      setStatusLabel(STATUS_STEPS[STATUS_STEPS.length - 1].label);
      setTimeout(() => showResult(data), 300);
    } catch (err) {
      show(err.message || 'Could not reach the identification service', 'error');
      setStage('upload');
    } finally {
      stopFakeProgress();
    }
  }

  function showResult(sp) {
    setResult(sp);
    setActiveTab('overview');
    setStage('result');
    saveToRecent(sp);
    setConfDisplay(0);
    let n = 0;
    const timer = setInterval(() => {
      n += 3;
      if (n >= sp.confidence) { n = sp.confidence; clearInterval(timer); }
      setConfDisplay(n);
    }, 20);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // "Try a Sample Photo" — no real device photo needed, uses a bundled
  // static asset as a real (if generic) image so the request still
  // exercises the actual /api/identify pipeline end-to-end.
  async function identifySample() {
    try {
      const res = await fetch('/icons/icon-512.png');
      const blob = await res.blob();
      identifyFile(new File([blob], 'sample.png', { type: blob.type }));
    } catch {
      show('Could not load the sample photo', 'error');
    }
  }

  return (
    <>
      <Seo
        title="AI Wildlife Identifier — WildLens"
        description="Upload a photo or use your camera to identify any species instantly with WildLens's AI wildlife identifier."
        path="/identify"
      />

      <header className="page-hero">
        <div className="container-wl text-center">
          <span className="kicker" data-aos="fade-up"><span className="dot"></span> Flagship Feature</span>
          <h1 className="mt-3" data-aos="fade-up" data-aos-delay="60">AI Wildlife Identifier</h1>
          <p className="lede mx-auto" style={{ maxWidth: 560 }} data-aos="fade-up" data-aos-delay="120">
            Upload a photo or use your camera. Our model identifies the species and surfaces everything worth knowing — in seconds.
          </p>
        </div>
      </header>

      <section className="pb-5">
        <div className="container-wl" style={{ maxWidth: 980 }}>
          {stage === 'upload' && (
            <div data-aos="fade-up">
              <div
                className={`dropzone${dragOver ? ' drag-over' : ''}`}
                tabIndex={0}
                role="button"
                aria-label="Upload a wildlife photo"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) identifyFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="dropzone-icon"><i className="bi bi-cloud-arrow-up"></i></div>
                <h3 className="mb-2" style={{ fontSize: '1.3rem' }}>Drag &amp; drop a photo here</h3>
                <p className="mb-0">or choose an option below · JPG, PNG, HEIC up to 20MB</p>
                <input
                  ref={fileInputRef} type="file" accept="image/*" hidden
                  onChange={(e) => { if (e.target.files.length) identifyFile(e.target.files[0]); e.target.value = ''; }}
                />
              </div>

              <div className="upload-actions">
                <button className="btn-wl btn-primary-wl" onClick={() => fileInputRef.current?.click()}><i className="bi bi-upload"></i> Upload Photo</button>
                <button className="btn-wl btn-outline-wl" onClick={() => setCameraOpen(true)}><i className="bi bi-camera-fill"></i> Use Camera</button>
                <button className="btn-wl btn-ghost-wl" onClick={identifySample}><i className="bi bi-magic"></i> Try a Sample Photo</button>
              </div>

              {recent.length > 0 && (
                <div className="mt-5">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="spec-tag text-uppercase">Recent Uploads</span>
                    <button className="btn-wl btn-ghost-wl btn-sm-wl" onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}>
                      <i className="bi bi-trash3"></i> Clear
                    </button>
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    {recent.map((item, i) => (
                      <div className="thumb-chip" title={item.name} key={i}>
                        <div className="species-art tone-c" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-binoculars" style={{ fontSize: '1.4rem', color: 'var(--accent-bright)' }}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'analyzing' && (
            <div data-aos="fade-up">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-md-5">
                  <div className="analysis-frame reticle is-active">
                    <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                    <div className="scan-line is-scanning"></div>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-camera" style={{ fontSize: '2.4rem', color: 'var(--accent-bright)' }}></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-7">
                  <span className="stage-status">{statusLabel}</span>
                  <h3 className="mt-2 mb-3" style={{ fontSize: '1.5rem' }}>Analyzing your photo</h3>
                  <div className="progress-wl mb-2"><div className="bar" style={{ width: `${progress}%` }}></div></div>
                  <p className="spec-tag">{Math.round(progress)}%</p>
                  <ul className="list-unstyled mt-4 d-flex flex-column gap-2">
                    {STATUS_STEPS.map((s, i) => {
                      const active = progress >= s.t;
                      return (
                        <li className="step-mini" key={s.label}>
                          <span className="n" style={active ? { borderColor: 'var(--accent)', color: 'var(--accent-bright)' } : undefined}>{i + 1}</span>{' '}
                          <span className={`text-muted-wl${active ? ' text-ink' : ''}`}>{s.label.replace('…', '').toLowerCase().replace(/^./, (c) => c.toUpperCase())}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {stage === 'result' && result && (
            <div ref={resultRef}>
              <div className="d-flex justify-content-between align-items-center mb-4" data-aos="fade-up">
                <button className="back-link btn btn-link p-0 border-0" style={{ background: 'none' }} onClick={() => setStage('upload')}>
                  <i className="bi bi-arrow-left"></i> Identify another photo
                </button>
              </div>

              <div className="row g-4">
                <div className="col-12 col-lg-5">
                  <div className="analysis-frame reticle is-active" data-aos="fade-up">
                    <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="specimen-plate-num">AI MATCH</span>
                      <div className="specimen-latin">{result.scientific_name}</div>
                      <i className="bi bi-binoculars" style={{ fontSize: '2.6rem', color: 'var(--accent-bright)' }}></i>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-4 mt-4" data-aos="fade-up">
                    <div className="confidence-ring">
                      <svg width="118" height="118" viewBox="0 0 118 118">
                        <circle className="track" cx="59" cy="59" r="50" fill="none" strokeWidth="10" />
                        <circle
                          className="val" cx="59" cy="59" r="50" fill="none" strokeWidth="10"
                          strokeDasharray="314" strokeDashoffset={314 - (314 * result.confidence) / 100}
                        />
                      </svg>
                      <div className="center"><span className="n">{confDisplay}%</span><span className="l">Match</span></div>
                    </div>
                    <div>
                      <div className="fw-bold text-ink" style={{ fontSize: '1.05rem' }}>Confidence Score</div>
                      <p className="mb-0" style={{ fontSize: '0.86rem' }}>Based on visual markers: coat pattern, silhouette, and facial structure.</p>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4" data-aos="fade-up">
                    <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => requireAuth(() => show('Saved to your collection'))}><i className="bi bi-bookmark"></i> Save</button>
                    <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show('Share link copied')}><i className="bi bi-share"></i> Share</button>
                    <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show('Preparing download…')}><i className="bi bi-download"></i> Download</button>
                    <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show("Reported — thank you, we'll take a look", 'warn')}><i className="bi bi-flag"></i> Report</button>
                  </div>
                </div>

                <div className="col-12 col-lg-7">
                  <div data-aos="fade-up">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: 2 }}>{result.predicted_species}</h2>
                        <p className="sci-name mb-0" style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>{result.scientific_name}</p>
                      </div>
                      <span className="badge-wl badge-neutral">Identified</span>
                    </div>

                    <div className="wl-tabs mt-4">
                      {['overview', 'habitat', 'diet', 'facts', 'conservation', 'related'].map((tab) => (
                        <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                          {tab === 'related' ? 'Related Species' : tab[0].toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4">
                      {activeTab === 'overview' && (
                        <div>
                          {[['Class', result.class_name], ['Family', result.family], ['Lifespan', result.lifespan],
                            ['Size', result.size], ['Weight', result.weight], ['Diet Type', result.diet_type]].map(([k, v]) => (
                            <div className="info-row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'habitat' && (
                        <div>
                          <p className="lede" style={{ fontSize: '0.98rem' }}>{result.habitat}</p>
                          <div className="map-preview mt-3"><div className="pin"><i className="bi bi-geo-alt-fill"></i></div><div className="label">Range overview</div></div>
                        </div>
                      )}
                      {activeTab === 'diet' && <p className="lede" style={{ fontSize: '0.98rem' }}>{result.diet_text}</p>}
                      {activeTab === 'facts' && (
                        <div>
                          {result.facts.map((f, i) => (
                            <div className="fact-item" key={i}><span className="fact-num">{String(i + 1).padStart(2, '0')}</span><p className="mb-0">{f}</p></div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'conservation' && <p className="lede" style={{ fontSize: '0.98rem' }}>{result.conservation_text}</p>}
                      {activeTab === 'related' && (
                        <div className="row g-3">
                          <div className="col-12">
                            <Link to="/encyclopedia" className="card-wl d-block text-decoration-none p-3">
                              <div className="fw-bold text-ink" style={{ fontSize: '0.92rem' }}>Browse the full encyclopedia</div>
                              <div className="sci-name" style={{ fontSize: '0.78rem' }}>Related species suggestions coming soon</div>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-wl">
          <div className="section-head center" data-aos="fade-up">
            <span className="kicker">How It Works</span>
            <h2>From photo to field notes in seconds</h2>
          </div>
          <div className="row g-4">
            <div className="col-12 col-md-4" data-aos="fade-up">
              <div className="feat-card text-center h-100">
                <div className="feat-icon mx-auto"><i className="bi bi-cloud-arrow-up"></i></div>
                <h3>1. Upload or Capture</h3>
                <p>Drop a photo, upload from your device, or snap one live with your camera.</p>
              </div>
            </div>
            <div className="col-12 col-md-4" data-aos="fade-up" data-aos-delay="80">
              <div className="feat-card text-center h-100">
                <div className="feat-icon mx-auto"><i className="bi bi-cpu"></i></div>
                <h3>2. AI Analysis</h3>
                <p>Our model scans visual markers — coat, silhouette, and structure — against a global species index.</p>
              </div>
            </div>
            <div className="col-12 col-md-4" data-aos="fade-up" data-aos-delay="160">
              <div className="feat-card text-center h-100">
                <div className="feat-icon mx-auto"><i className="bi bi-journal-check"></i></div>
                <h3>3. Get the Full Picture</h3>
                <p>Habitat, diet, conservation status, and related species — ready to save or share.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(blob) => { setCameraOpen(false); identifyFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' })); }}
      />
    </>
  );
}

function CameraModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [hint, setHint] = useState('Allow camera access, frame your subject, then capture.');

  useEffect(() => {
    if (!open) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHint("Camera access isn't supported in this browser.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setHint('Camera access was denied. Enable it in your browser settings, or upload a photo instead.'));
    return () => {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    };
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) onCapture(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-header border-0">
        <h5 className="modal-title text-ink">Use Camera</h5>
        <button type="button" className="btn-icon-wl" aria-label="Close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
      </div>
      <div className="modal-body">
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 'var(--r-md)', background: '#000' }} />
        <p className="mt-3 mb-0 text-muted-wl" style={{ fontSize: '0.85rem' }}>{hint}</p>
      </div>
      <div className="modal-footer border-0">
        <button className="btn-wl btn-outline-wl" onClick={onClose}>Cancel</button>
        <button className="btn-wl btn-primary-wl" onClick={capture}><i className="bi bi-camera-fill"></i> Capture</button>
      </div>
    </Modal>
  );
}
