import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Seo from '../components/Seo';
import VIDEO_ART from '../data/videoArt.json';

const TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const MOTIONS = [
  { key: 'zoomin', icon: 'bi-zoom-in', label: 'Zoom In' },
  { key: 'zoomout', icon: 'bi-zoom-out', label: 'Zoom Out' },
  { key: 'panleft', icon: 'bi-arrow-left', label: 'Pan Left' },
  { key: 'panright', icon: 'bi-arrow-right', label: 'Pan Right' },
  { key: 'orbit', icon: 'bi-arrow-repeat', label: 'Orbit' },
  { key: 'static', icon: 'bi-square', label: 'Static' },
];
const LOADING_TEXTS = ['RENDERING FRAMES…', 'APPLYING CAMERA MOTION…', 'COMPOSITING…', 'ENCODING MP4…'];
const HISTORY_KEY = 'wl_video_creations';

function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
function saveHistory(list) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch { /* non-fatal */ } }

export default function ImageToVideo() {
  const { requireAuth } = useAuth();
  const { show } = useToast();

  const [motion, setMotion] = useState('zoomin');
  const [motionStrength, setMotionStrength] = useState(60);
  const [duration, setDuration] = useState('5 seconds');
  const [model, setModel] = useState('WildLens Motion v1');

  const [canvasState, setCanvasState] = useState('empty'); // empty | loading | result
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [clip, setClip] = useState(null); // { art, tone, motion }
  const [history, setHistory] = useState([]);

  const [playing, setPlaying] = useState(false);
  const [playPct, setPlayPct] = useState(0);
  const rafRef = useRef(null);
  const startTsRef = useRef(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const durationSec = parseInt(duration, 10) || 5;

  const runGenerate = () => {
    setCanvasState('loading');
    setProgress(0);
    setPlaying(false);
    setPlayPct(0);
    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 10 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setTimeout(reveal, 300);
      }
      setProgress(p);
      setLoadingText(LOADING_TEXTS[Math.min(LOADING_TEXTS.length - 1, Math.floor(p / 26))]);
    }, 260);
  };

  const reveal = () => {
    const art = VIDEO_ART[Math.floor(Math.random() * VIDEO_ART.length)];
    const tone = TONES[Math.floor(Math.random() * TONES.length)];
    setClip({ art, tone, motion });
    setCanvasState('result');
    const list = [{ label: `${motion.charAt(0).toUpperCase()}${motion.slice(1)} motion clip`, time: 'Just now', art, tone }, ...loadHistory()].slice(0, 12);
    saveHistory(list);
    setHistory(list);
  };

  const onGenerateClick = () => requireAuth(runGenerate);

  const togglePlay = () => {
    setPlaying((wasPlaying) => {
      const next = !wasPlaying;
      if (next) {
        startTsRef.current = null;
        const tick = (ts) => {
          if (!startTsRef.current) startTsRef.current = ts;
          const elapsed = (ts - startTsRef.current) / 1000;
          const pct = Math.min(100, (elapsed / durationSec) * 100);
          setPlayPct(pct);
          if (pct < 100) rafRef.current = requestAnimationFrame(tick);
          else setPlaying(false);
        };
        rafRef.current = requestAnimationFrame(tick);
      } else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return next;
    });
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const elapsedSec = (playPct / 100) * durationSec;
  const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

  return (
    <>
      <Seo
        title="AI Image-to-Video — WildLens Studio"
        description="Turn a still wildlife photo into a short cinematic clip with WildLens's AI Studio — choose camera motion, pacing, and duration."
        path="/image-to-video"
      />

      <header className="page-hero">
        <div className="container-wl">
          <span className="kicker" data-aos="fade-up"><i className="bi bi-film"></i> AI Studio</span>
          <h1 className="mt-3" data-aos="fade-up" data-aos-delay="60">Bring your photos to life</h1>
          <p className="lede mt-2" style={{ maxWidth: 560 }} data-aos="fade-up" data-aos-delay="120">Turn a still wildlife photo into a short cinematic clip — choose the camera motion, pacing, and let the AI do the rest.</p>
        </div>
      </header>

      <section className="pb-5">
        <div className="container-wl">
          <div className="studio-shell">
            <div>
              <div className="studio-panel">
                <div className="studio-panel-title">Source Image</div>
                <div className="dropzone" style={{ padding: '34px 18px' }} onClick={() => show('Photo loaded')}>
                  <div className="dropzone-icon" style={{ width: 58, height: 58, fontSize: '1.4rem' }}><i className="bi bi-cloud-arrow-up"></i></div>
                  <p className="mb-0" style={{ fontSize: '0.86rem' }}>Click or drop a photo to animate</p>
                </div>

                <div className="field-group mt-4">
                  <label className="field-label">Camera Motion</label>
                  <div className="motion-grid">
                    {MOTIONS.map((m) => (
                      <div key={m.key} className={`motion-opt${motion === m.key ? ' active' : ''}`} onClick={() => setMotion(m.key)}>
                        <i className={`bi ${m.icon}`}></i>{m.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Motion Strength <span className="spec-tag">{motionStrength}%</span></label>
                  <input type="range" className="range-wl" min="0" max="100" step="10" value={motionStrength} onChange={(e) => setMotionStrength(Number(e.target.value))} />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="durationSelect">Duration</label>
                  <select className="wl-select" id="durationSelect" value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option>3 seconds</option><option>5 seconds</option><option>10 seconds</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="videoModelSelect">Model</label>
                  <select className="wl-select" id="videoModelSelect" value={model} onChange={(e) => setModel(e.target.value)}>
                    <option>WildLens Motion v1</option><option>WildLens Motion v1 HD</option>
                  </select>
                </div>

                <button className="btn-wl btn-primary-wl w-100 mt-3" onClick={onGenerateClick}><i className="bi bi-film"></i> Generate Video</button>
              </div>
            </div>

            <div>
              <div className="canvas-area" style={{ aspectRatio: '16/9', minHeight: 'unset' }}>
                {canvasState === 'empty' && (
                  <div className="text-center px-4">
                    <div className="dropzone-icon mx-auto" style={{ width: 64, height: 64, fontSize: '1.5rem' }}><i className="bi bi-film"></i></div>
                    <p className="mt-3 mb-0">Your video preview will appear here</p>
                  </div>
                )}
                {canvasState === 'loading' && (
                  <div className="text-center px-4">
                    <div className="spinner-border" style={{ color: 'var(--accent-bright)', width: '2.5rem', height: '2.5rem' }} role="status"></div>
                    <p className="mt-3 mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-bright)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{loadingText}</p>
                    <div className="progress-wl mt-2" style={{ width: 220 }}><div className="bar" style={{ width: `${progress}%` }}></div></div>
                  </div>
                )}
                {canvasState === 'result' && clip && (
                  <div className={`video-frame motion-${clip.motion}${playing ? ' playing' : ''}`}>
                    <div className={`species-art ${clip.tone}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 240 240" style={{ width: '48%', height: '48%', filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.5))' }} dangerouslySetInnerHTML={{ __html: clip.art }} />
                    </div>
                    <div className="video-controls">
                      <div className="video-play-btn" onClick={togglePlay}><i className={`bi ${playing ? 'bi-pause-fill' : 'bi-play-fill'}`}></i></div>
                      <div className="video-scrub"><div className="fill" style={{ width: `${playPct}%` }}></div></div>
                      <span className="video-time">{fmt(elapsedSec)} / 0:{String(durationSec).padStart(2, '0')}</span>
                    </div>
                  </div>
                )}
              </div>

              {canvasState === 'result' && (
                <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
                  <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={runGenerate}><i className="bi bi-arrow-repeat"></i> Regenerate</button>
                  <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show('Preparing MP4 download…')}><i className="bi bi-download"></i> Download MP4</button>
                  <a href="/community" className="btn-wl btn-outline-wl btn-sm-wl"><i className="bi bi-share"></i> Share to Community</a>
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="studio-panel">
                <div className="studio-panel-title">Credits Usage</div>
                <div className="credit-meter">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <span className="text-ink fw-bold" style={{ fontSize: '1.3rem' }}>128</span>
                    <span className="spec-tag">/ 200 video credits</span>
                  </div>
                  <div className="credit-bar"><div className="fill" style={{ width: '64%' }}></div></div>
                  <span className="spec-tag">Resets in 12 days</span>
                </div>
              </div>

              <div className="studio-panel">
                <div className="studio-panel-title">
                  Recent Creations
                  <button className="btn-wl btn-ghost-wl btn-sm-wl" style={{ padding: '4px 10px' }} onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
                <div className="d-flex flex-column gap-1">
                  {history.length === 0 && <p className="spec-tag">Nothing generated yet.</p>}
                  {history.slice(0, 6).map((item, i) => (
                    <div className="history-item" key={i}>
                      <div className={`history-thumb species-art ${item.tone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 240 240" style={{ width: '70%', height: '70%' }} dangerouslySetInnerHTML={{ __html: item.art }} />
                      </div>
                      <div><div className="t">{item.label}</div><div className="s">{item.time}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="studio-panel">
                <div className="studio-panel-title">Tips</div>
                <ul className="ps-3 mb-0" style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  <li className="mb-2">High-resolution stills animate more smoothly.</li>
                  <li className="mb-2">Subtle motion (30–50%) looks most natural for portraits.</li>
                  <li>Orbit works best with a clear, centred subject.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
