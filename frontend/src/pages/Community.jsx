import { useMemo, useState } from 'react';
import Seo from '../components/Seo';
import Modal from '../components/Modal';
import CommunityArt from '../components/CommunityArt';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SIGHTINGS_SEED from '../data/communitySightings.json';

const FIXED_COMMENTS = [
  { user: 'PineTrail', text: 'Incredible shot — what lens did you use?' },
  { user: 'Fernwood', text: 'Seen one in almost the same spot last spring!' },
  { user: 'RiverBend', text: 'This made my morning. Thank you for sharing.' },
];

function initials(name) { return name.slice(0, 2).toUpperCase(); }

export default function Community() {
  // Local, mutable copy so like-toggling can update counts without
  // touching the imported JSON module.
  const [sightings, setSightings] = useState(() => SIGHTINGS_SEED.map((s) => ({ ...s, liked: false })));
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [shown, setShown] = useState(6);
  const [openIdx, setOpenIdx] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareForm, setShareForm] = useState({ species: '', location: '', caption: '' });
  const [commentDraft, setCommentDraft] = useState('');
  const { requireAuth } = useAuth();
  const { show } = useToast();

  const filtered = useMemo(() => {
    let list = sightings.map((s, i) => ({ ...s, _idx: i }));
    if (filter === 'verified') list = list.filter((s) => s.verified);
    if (sort === 'liked') list = [...list].sort((a, b) => b.likes - a.likes);
    if (sort === 'commented') list = [...list].sort((a, b) => b.comments - a.comments);
    return list;
  }, [sightings, filter, sort]);

  const visible = filtered.slice(0, shown);
  const openSighting = openIdx !== null ? sightings[openIdx] : null;

  const toggleLike = (idx) => {
    setSightings((list) => list.map((s, i) => (
      i === idx ? { ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) } : s
    )));
  };

  const postComment = () => {
    requireAuth(() => {
      if (!commentDraft.trim()) return;
      show('Comment posted');
      setCommentDraft('');
    });
  };

  const postSighting = () => {
    setShareOpen(false);
    show('Sighting posted — thank you for contributing!');
    setShareForm({ species: '', location: '', caption: '' });
  };

  return (
    <>
      <Seo
        title="Community Sightings — WildLens"
        description="Recent wildlife sightings shared by naturalists around the world — browse, like, comment, and share your own."
        path="/community"
      />

      <header className="page-hero">
        <div className="container-wl d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <span className="kicker" data-aos="fade-up"><i className="bi bi-people"></i> Community</span>
            <h1 className="mt-3" data-aos="fade-up" data-aos-delay="60">Recent sightings</h1>
            <p className="lede mt-2" style={{ maxWidth: 520 }} data-aos="fade-up" data-aos-delay="120">Captured by naturalists around the world, moments ago.</p>
          </div>
          <button className="btn-wl btn-primary-wl" data-aos="fade-up" onClick={() => requireAuth(() => setShareOpen(true))}>
            <i className="bi bi-plus-lg"></i> Share a Sighting
          </button>
        </div>
      </header>

      <section className="pb-5">
        <div className="container-wl">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4" data-aos="fade-up">
            <div className="d-flex gap-2 flex-wrap">
              <button className={`tag-pill${filter === 'all' ? ' active' : ''}`} onClick={() => { setFilter('all'); setShown(6); }}>All Sightings</button>
              <button className={`tag-pill${filter === 'verified' ? ' active' : ''}`} onClick={() => { setFilter('verified'); setShown(6); }}>
                <i className="bi bi-patch-check-fill me-1"></i>Verified Only
              </button>
            </div>
            <div className="sort-select-wrap">
              <select aria-label="Sort sightings" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="liked">Most Liked</option>
                <option value="commented">Most Discussed</option>
              </select>
              <i className="bi bi-chevron-down"></i>
            </div>
          </div>

          <div className="row g-4">
            {visible.map((s) => (
              <div className="col-12 col-md-6 col-lg-4" key={s._idx}>
                <div className="card-wl reticle h-100" style={{ cursor: 'pointer' }} onClick={() => setOpenIdx(s._idx)}>
                  <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                  <div className={`card-media species-art ${s.tone}`}>
                    <div className="badge-overlay badge-wl badge-neutral"><i className="bi bi-geo-alt-fill"></i> {s.loc}</div>
                    <div className="card-actions">
                      <button className="icon-chip" aria-label="Save" onClick={(e) => { e.stopPropagation(); requireAuth(() => show('Saved to your collection')); }}>
                        <i className="bi bi-heart"></i>
                      </button>
                    </div>
                    <CommunityArt artKey={s.key} />
                    <div className="carousel-dots"><span className="active"></span><span></span><span></span></div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <h3 style={{ fontSize: '1.05rem' }}>{s.name}</h3>
                      <span className="spec-tag">{s.time}</span>
                    </div>
                    <p className="clamp-2 mb-3" style={{ fontSize: '0.86rem' }}>{s.caption}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-ring" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{initials(s.user)}</div>
                        <span className="spec-tag">@{s.user}{s.verified && <i className="bi bi-patch-check-fill ms-1" style={{ color: 'var(--accent-bright)' }}></i>}</span>
                      </div>
                    </div>
                    <div className="engage-row mt-3">
                      <button className={`engage-btn${s.liked ? ' is-active' : ''}`} onClick={(e) => { e.stopPropagation(); requireAuth(() => toggleLike(s._idx)); }}>
                        <i className={`bi ${s.liked ? 'bi-heart-fill' : 'bi-heart'}`}></i> <span>{s.likes}</span>
                      </button>
                      <button className="engage-btn" onClick={(e) => { e.stopPropagation(); setOpenIdx(s._idx); }}><i className="bi bi-chat"></i> {s.comments}</button>
                      <button className="engage-btn" onClick={(e) => { e.stopPropagation(); show('Link copied'); }}><i className="bi bi-share"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {shown < filtered.length && (
            <div className="text-center mt-5">
              <button className="btn-wl btn-outline-wl" onClick={() => setShown((n) => n + 6)}>
                <i className="bi bi-arrow-down-circle"></i> Load More Sightings
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Sighting detail modal */}
      <Modal open={openSighting !== null} onClose={() => setOpenIdx(null)} dialogClassName="modal-dialog-centered modal-lg">
        {openSighting && (
          <>
            <div className={`detail-gallery species-art ${openSighting.tone}`}>
              <button type="button" className="btn-icon-wl position-absolute" style={{ top: 16, right: 16, zIndex: 5 }} aria-label="Close" onClick={() => setOpenIdx(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="badge-overlay badge-wl badge-neutral"><i className="bi bi-geo-alt-fill"></i> {openSighting.loc}</div>
              <CommunityArt artKey={openSighting.key} />
              <div className="carousel-dots"><span className="active"></span><span></span><span></span></div>
            </div>
            <div className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-ring">{initials(openSighting.user)}</div>
                  <div>
                    <div className="fw-bold text-ink">@{openSighting.user}{openSighting.verified && <i className="bi bi-patch-check-fill ms-1" style={{ color: 'var(--accent-bright)' }}></i>}</div>
                    <div className="spec-tag">{openSighting.time}</div>
                  </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{openSighting.name}</h2>
              </div>
              <p className="mt-3" style={{ fontSize: '0.96rem' }}>{openSighting.caption}</p>
              <div className="map-preview mt-3"><div className="pin"><i className="bi bi-geo-alt-fill"></i></div><div className="label">{openSighting.loc}</div></div>
              <div className="engage-row mt-4">
                <button className={`engage-btn${openSighting.liked ? ' is-active' : ''}`} onClick={() => requireAuth(() => toggleLike(openIdx))}>
                  <i className={`bi ${openSighting.liked ? 'bi-heart-fill' : 'bi-heart'}`}></i> <span>{openSighting.likes}</span>
                </button>
                <button className="engage-btn"><i className="bi bi-chat"></i> {openSighting.comments} comments</button>
                <button className="engage-btn" onClick={() => show('Link copied')}><i className="bi bi-share"></i> Share</button>
                <button className="engage-btn" onClick={() => requireAuth(() => show('Saved to your collection'))}><i className="bi bi-bookmark"></i></button>
              </div>
              <hr className="divider-wl my-4" />
              <h6 className="spec-tag text-uppercase mb-2">Comments</h6>
              {FIXED_COMMENTS.map((c, i) => (
                <div className="comment-row" key={i}>
                  <div className="comment-avatar">{initials(c.user)}</div>
                  <div><div className="fw-bold text-ink" style={{ fontSize: '0.86rem' }}>@{c.user}</div><p className="mb-0" style={{ fontSize: '0.86rem' }}>{c.text}</p></div>
                </div>
              ))}
              <div className="comment-input-row mt-3">
                <div className="comment-avatar">YOU</div>
                <input
                  className="wl-input" placeholder="Add a comment…" style={{ borderRadius: 999 }}
                  value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }}
                />
                <button className="btn-icon-wl" aria-label="Post comment" onClick={postComment}><i className="bi bi-send"></i></button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Share a sighting modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)}>
        <div className="modal-header border-0">
          <h5 className="modal-title text-ink">Share a Sighting</h5>
          <button type="button" className="btn-icon-wl" aria-label="Close" onClick={() => setShareOpen(false)}><i className="bi bi-x-lg"></i></button>
        </div>
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); postSighting(); }}>
          <div className="field-group">
            <label className="field-label">Photo</label>
            <div className="dropzone" style={{ padding: '30px 20px' }}>
              <div className="dropzone-icon" style={{ width: 54, height: 54, fontSize: '1.3rem' }}><i className="bi bi-camera"></i></div>
              <p className="mb-0" style={{ fontSize: '0.85rem' }}>Click to upload a photo of your sighting</p>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="shareSpecies">Species (optional)</label>
            <input className="wl-input" id="shareSpecies" placeholder="e.g. Red Fox — leave blank to ask the community"
              value={shareForm.species} onChange={(e) => setShareForm((f) => ({ ...f, species: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="shareLocation">Location</label>
            <input className="wl-input" id="shareLocation" placeholder="e.g. Yellowstone, USA"
              value={shareForm.location} onChange={(e) => setShareForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="field-group mb-0">
            <label className="field-label" htmlFor="shareCaption">Caption</label>
            <textarea className="wl-textarea" id="shareCaption" style={{ minHeight: 80 }} placeholder="What did you see?"
              value={shareForm.caption} onChange={(e) => setShareForm((f) => ({ ...f, caption: e.target.value }))} />
          </div>
        </form>
        <div className="modal-footer border-0">
          <button className="btn-wl btn-outline-wl" onClick={() => setShareOpen(false)}>Cancel</button>
          <button className="btn-wl btn-primary-wl" onClick={postSighting}><i className="bi bi-send"></i> Post Sighting</button>
        </div>
      </Modal>
    </>
  );
}
