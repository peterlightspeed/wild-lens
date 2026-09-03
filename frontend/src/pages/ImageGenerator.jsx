import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import STUDIO_ART from '../data/studioArt.json';

const TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const SUGGESTIONS = [
  { label: 'Snow leopard, misty peak', fill: 'A snow leopard resting on a rocky ledge, misty Himalayan backdrop' },
  { label: 'Morpho macro shot', fill: 'A blue morpho butterfly on a rainforest leaf, macro, dew drops' },
  { label: 'Whale breach, sunset', fill: 'A humpback whale breaching at sunset, dramatic ocean spray' },
];
const CREATIONS_KEY = 'wl_studio_creations';
const PROMPT_KEY = 'wl_prompt_history';

function loadHistory(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveHistory(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* non-fatal */ }
}
function randomArt() {
  const art = STUDIO_ART[Math.floor(Math.random() * STUDIO_ART.length)];
  const tone = TONES[Math.floor(Math.random() * TONES.length)];
  return { art, tone };
}

export default function ImageGenerator() {
  const location = useLocation();
  const { requireAuth } = useAuth();
  const { show } = useToast();

  const [tool, setTool] = useState('generate');
  const [canvasState, setCanvasState] = useState('empty'); // empty | loading | result
  const [loadingText, setLoadingText] = useState('RENDERING…');
  const [result, setResult] = useState(null); // { kind: 'generate'|'bg'|'upscale', art, tone }
  const [baValue, setBaValue] = useState(50);

  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState('1:1');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [negPrompt, setNegPrompt] = useState('');
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(30);
  const [seed, setSeed] = useState('482910');
  const [model, setModel] = useState('WildLens Diffusion v3');

  const [outputFormat, setOutputFormat] = useState('PNG (transparent)');
  const [edgeRefine, setEdgeRefine] = useState(true);
  const [scaleFactor, setScaleFactor] = useState('4×');
  const [denoise, setDenoise] = useState(40);
  const [enhanceFaces, setEnhanceFaces] = useState(false);

  const [recentCreations, setRecentCreations] = useState([]);
  const [promptHistory, setPromptHistory] = useState([]);

  useEffect(() => {
    setRecentCreations(loadHistory(CREATIONS_KEY));
    setPromptHistory(loadHistory(PROMPT_KEY));
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'bg-remover' || hash === 'upscaler') setTool(hash);
  }, [location.hash]);

  const resetCanvas = () => { setCanvasState('empty'); setResult(null); };

  const runGenerate = (label) => {
    setCanvasState('loading');
    setLoadingText('RENDERING…');
    setTimeout(() => {
      const art = randomArt();
      setResult({ kind: 'generate', ...art });
      setCanvasState('result');
      const creations = [{ label, time: 'Just now', art: art.art, tone: art.tone }, ...loadHistory(CREATIONS_KEY)].slice(0, 12);
      saveHistory(CREATIONS_KEY, creations);
      setRecentCreations(creations);
    }, 1800);
  };

  const onGenerateClick = () => {
    requireAuth(() => {
      const p = prompt.trim() || 'Untitled wildlife scene';
      const prompts = [p, ...loadHistory(PROMPT_KEY)].slice(0, 10);
      saveHistory(PROMPT_KEY, prompts);
      setPromptHistory(prompts);
      runGenerate(p.slice(0, 40));
    });
  };

  const runRemoveBg = () => {
    requireAuth(() => {
      setCanvasState('loading');
      setLoadingText('REMOVING BACKGROUND…');
      setTimeout(() => {
        const art = randomArt();
        setResult({ kind: 'bg', ...art });
        setCanvasState('result');
        show('Background removed');
      }, 1600);
    });
  };

  const runUpscale = () => {
    requireAuth(() => {
      setCanvasState('loading');
      setLoadingText(`UPSCALING ${scaleFactor}…`);
      setTimeout(() => {
        const art = randomArt();
        setResult({ kind: 'upscale', ...art });
        setBaValue(50);
        setCanvasState('result');
        show('Upscale complete');
      }, 1800);
    });
  };

  const onDropzoneClick = () => {
    setCanvasState('loading');
    setLoadingText('IMAGE LOADED — READY');
    setTimeout(() => setCanvasState('empty'), 900);
  };

  return (
    <>
      <Seo
        title="AI Image Generator — WildLens Studio"
        description="Generate original wildlife imagery, remove backgrounds, and upscale your best shots in the WildLens AI Studio."
        path="/image-generator"
      />

      <header className="page-hero">
        <div className="container-wl">
          <span className="kicker" data-aos="fade-up"><i className="bi bi-stars"></i> AI Studio</span>
          <h1 className="mt-3" data-aos="fade-up" data-aos-delay="60">Create wildlife art</h1>
          <p className="lede mt-2" style={{ maxWidth: 560 }} data-aos="fade-up" data-aos-delay="120">Generate original wildlife imagery, remove backgrounds, and upscale your best shots — all in one studio.</p>
          <div className="tool-switch mt-4" data-aos="fade-up" data-aos-delay="160">
            <button className={tool === 'generate' ? 'active' : ''} onClick={() => { setTool('generate'); resetCanvas(); }}><i className="bi bi-magic"></i> Generate</button>
            <button className={tool === 'bg-remover' ? 'active' : ''} onClick={() => { setTool('bg-remover'); resetCanvas(); }}><i className="bi bi-scissors"></i> Background Remover</button>
            <button className={tool === 'upscaler' ? 'active' : ''} onClick={() => { setTool('upscaler'); resetCanvas(); }}><i className="bi bi-arrows-angle-expand"></i> Upscaler</button>
          </div>
        </div>
      </header>

      <section className="pb-5">
        <div className="container-wl">
          <div className="studio-shell">
            <div>
              {tool === 'generate' && (
                <div className="studio-panel">
                  <div className="studio-panel-title">Prompt <span className="badge-wl badge-neutral">Step 1</span></div>
                  <div className="field-group">
                    <textarea className="wl-textarea" placeholder="A red fox in a snow-covered pine forest at golden hour, cinematic, detailed fur…"
                      value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    <div className="field-hint">Be specific about species, setting, lighting, and mood.</div>
                  </div>
                  <div className="chip-row mb-2">
                    {SUGGESTIONS.map((s) => (
                      <button className="suggest-chip" key={s.label} onClick={() => setPrompt(s.fill)}>{s.label}</button>
                    ))}
                  </div>

                  <div className="field-group mt-4">
                    <label className="field-label">Aspect Ratio</label>
                    <div className="aspect-grid">
                      {[['1:1', 20, 20], ['4:5', 17, 21], ['16:9', 24, 14], ['9:16', 13, 23]].map(([r, w, h]) => (
                        <div key={r} className={`aspect-opt${aspect === r ? ' active' : ''}`} onClick={() => setAspect(r)}>
                          <div className="shape" style={{ width: w, height: h }}></div>{r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="modelSelect">Model</label>
                    <select className="wl-select" id="modelSelect" value={model} onChange={(e) => setModel(e.target.value)}>
                      <option>WildLens Diffusion v3</option>
                      <option>WildLens Diffusion v2 Turbo</option>
                      <option>WildLens Photoreal</option>
                    </select>
                  </div>

                  <button className="btn-wl btn-ghost-wl btn-sm-wl w-100 justify-content-between" type="button" style={{ paddingLeft: 0 }} onClick={() => setAdvancedOpen((v) => !v)}>
                    Advanced Options <i className={`bi bi-chevron-${advancedOpen ? 'up' : 'down'}`}></i>
                  </button>
                  {advancedOpen && (
                    <div>
                      <div className="field-group mt-3">
                        <label className="field-label" htmlFor="negPrompt">Negative Prompt</label>
                        <textarea className="wl-textarea" id="negPrompt" style={{ minHeight: 70 }} placeholder="blurry, low detail, extra limbs, watermark"
                          value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Guidance Scale <span className="spec-tag">{guidance}</span></label>
                        <input type="range" className="range-wl" min="1" max="15" step="0.5" value={guidance} onChange={(e) => setGuidance(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Steps <span className="spec-tag">{steps}</span></label>
                        <input type="range" className="range-wl" min="10" max="60" step="1" value={steps} onChange={(e) => setSteps(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label" htmlFor="seedInput">Seed</label>
                        <div className="d-flex gap-2">
                          <input className="wl-input" id="seedInput" style={{ flex: 1 }} value={seed} onChange={(e) => setSeed(e.target.value)} />
                          <button className="btn-icon-wl" aria-label="Randomize seed" onClick={() => setSeed(String(Math.floor(Math.random() * 900000 + 100000)))}>
                            <i className="bi bi-shuffle"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="btn-wl btn-primary-wl w-100 mt-4" onClick={onGenerateClick}><i className="bi bi-stars"></i> Generate Image</button>
                </div>
              )}

              {tool === 'bg-remover' && (
                <div className="studio-panel">
                  <div className="studio-panel-title">Upload Image</div>
                  <div className="dropzone" style={{ padding: '34px 18px' }} onClick={onDropzoneClick}>
                    <div className="dropzone-icon" style={{ width: 58, height: 58, fontSize: '1.4rem' }}><i className="bi bi-cloud-arrow-up"></i></div>
                    <p className="mb-0" style={{ fontSize: '0.86rem' }}>Click or drop an image to remove its background</p>
                  </div>
                  <div className="field-group mt-4">
                    <label className="field-label" htmlFor="outputFormat">Output Format</label>
                    <select className="wl-select" id="outputFormat" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                      <option>PNG (transparent)</option><option>WebP (transparent)</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center justify-content-between field-group">
                    <label className="field-label mb-0" htmlFor="edgeRefine">Edge Refinement</label>
                    <div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="edgeRefine" checked={edgeRefine} onChange={(e) => setEdgeRefine(e.target.checked)} /></div>
                  </div>
                  <button className="btn-wl btn-primary-wl w-100 mt-3" onClick={runRemoveBg}><i className="bi bi-scissors"></i> Remove Background</button>
                </div>
              )}

              {tool === 'upscaler' && (
                <div className="studio-panel">
                  <div className="studio-panel-title">Upload Image</div>
                  <div className="dropzone" style={{ padding: '34px 18px' }} onClick={onDropzoneClick}>
                    <div className="dropzone-icon" style={{ width: 58, height: 58, fontSize: '1.4rem' }}><i className="bi bi-cloud-arrow-up"></i></div>
                    <p className="mb-0" style={{ fontSize: '0.86rem' }}>Click or drop an image to enhance its resolution</p>
                  </div>
                  <div className="field-group mt-4">
                    <label className="field-label" htmlFor="scaleFactor">Scale Factor</label>
                    <select className="wl-select" id="scaleFactor" value={scaleFactor} onChange={(e) => setScaleFactor(e.target.value)}>
                      <option>2×</option><option>4×</option><option>8×</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Denoise Strength <span className="spec-tag">{denoise}%</span></label>
                    <input type="range" className="range-wl" min="0" max="100" step="5" value={denoise} onChange={(e) => setDenoise(e.target.value)} />
                  </div>
                  <div className="d-flex align-items-center justify-content-between field-group">
                    <label className="field-label mb-0" htmlFor="enhanceFaces">Enhance Faces</label>
                    <div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="enhanceFaces" checked={enhanceFaces} onChange={(e) => setEnhanceFaces(e.target.checked)} /></div>
                  </div>
                  <button className="btn-wl btn-primary-wl w-100 mt-3" onClick={runUpscale}><i className="bi bi-arrows-angle-expand"></i> Upscale Image</button>
                </div>
              )}
            </div>

            <div>
              <div className="canvas-area">
                {canvasState === 'empty' && (
                  <div className="text-center px-4">
                    <div className="dropzone-icon mx-auto" style={{ width: 64, height: 64, fontSize: '1.5rem' }}><i className="bi bi-image"></i></div>
                    <p className="mt-3 mb-0">Your creation will appear here</p>
                  </div>
                )}
                {canvasState === 'loading' && (
                  <div className="text-center px-4">
                    <div className="spinner-border" style={{ color: 'var(--accent-bright)', width: '2.5rem', height: '2.5rem' }} role="status"></div>
                    <p className="mt-3 mb-1 stage-status" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-bright)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{loadingText}</p>
                  </div>
                )}
                {canvasState === 'result' && result && <ResultCanvas result={result} baValue={baValue} setBaValue={setBaValue} />}
              </div>

              {canvasState === 'result' && (
                <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
                  <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => runGenerate('Regenerated image')}><i className="bi bi-arrow-repeat"></i> Regenerate</button>
                  <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show('Preparing download…')}><i className="bi bi-download"></i> Download</button>
                  <a href="/image-to-video" className="btn-wl btn-outline-wl btn-sm-wl"><i className="bi bi-film"></i> Animate This</a>
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="studio-panel">
                <div className="studio-panel-title">Credits Usage</div>
                <div className="credit-meter">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <span className="text-ink fw-bold" style={{ fontSize: '1.3rem' }}>342</span>
                    <span className="spec-tag">/ 500 credits</span>
                  </div>
                  <div className="credit-bar"><div className="fill" style={{ width: '68.4%' }}></div></div>
                  <span className="spec-tag">Resets in 12 days</span>
                </div>
              </div>

              <div className="studio-panel">
                <div className="studio-panel-title">
                  Recent Creations
                  <button className="btn-wl btn-ghost-wl btn-sm-wl" style={{ padding: '4px 10px' }}
                    onClick={() => { localStorage.removeItem(CREATIONS_KEY); setRecentCreations([]); }}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
                <div className="d-flex flex-column gap-1">
                  {recentCreations.length === 0 && <p className="spec-tag">Nothing generated yet.</p>}
                  {recentCreations.slice(0, 6).map((item, i) => (
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
                <div className="studio-panel-title">Prompt History</div>
                <div className="d-flex flex-column gap-2">
                  {promptHistory.length === 0 && <p className="spec-tag">Your prompts will appear here.</p>}
                  {promptHistory.slice(0, 6).map((p, i) => (
                    <button className="suggest-chip text-start" style={{ borderRadius: 'var(--r-sm)', width: '100%' }} key={i} onClick={() => setPrompt(p)}>
                      {p.slice(0, 54)}{p.length > 54 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ResultCanvas({ result, baValue, setBaValue }) {
  if (result.kind === 'generate') {
    return (
      <div className={`species-art ${result.tone}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 240 240" style={{ width: '54%', height: '54%', filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.5))' }} dangerouslySetInnerHTML={{ __html: result.art }} />
      </div>
    );
  }
  if (result.kind === 'bg') {
    return (
      <div className="checker-bg" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 240 240" style={{ width: '54%', height: '54%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }} dangerouslySetInnerHTML={{ __html: result.art }} />
      </div>
    );
  }
  return (
    <div className="ba-wrap">
      <span className="badge-wl badge-neutral studio-canvas-label">Before</span>
      <div className="species-art tone-a" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'blur(2px) saturate(0.7)' }}>
        <svg viewBox="0 0 240 240" style={{ width: '46%', height: '46%' }} dangerouslySetInnerHTML={{ __html: result.art }} />
      </div>
      <div className="ba-after" style={{ width: `${baValue}%` }}>
        <span className="badge-wl badge-success" style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>After</span>
        <div className="species-art tone-a" style={{ width: '200%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 240 240" style={{ width: '27%', height: '54%' }} dangerouslySetInnerHTML={{ __html: result.art }} />
        </div>
      </div>
      <div className="ba-slider" style={{ left: `${baValue}%` }}></div>
      <input type="range" className="ba-range" min="0" max="100" value={baValue} aria-label="Before and after comparison slider"
        onChange={(e) => setBaValue(Number(e.target.value))} />
    </div>
  );
}
