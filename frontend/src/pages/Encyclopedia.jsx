import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '../components/Seo';
import Modal from '../components/Modal';
import EncyclopediaArt from '../components/EncyclopediaArt';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SPECIES from '../data/encyclopediaSpecies.json';

const PER_PAGE = 6;
const FILTERS = ['all', 'Mammal', 'Bird', 'Reptile', 'Insect', 'Marine', 'Fish', 'Amphibian'];

export default function Encyclopedia() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('az');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const location = useLocation();
  const { requireAuth } = useAuth();
  const { show } = useToast();

  // Same 700ms artificial skeleton delay as the static version
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Deep-link support, e.g. /encyclopedia#lion
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    if (SPECIES.some((s) => s.id === id)) {
      const t = setTimeout(() => setOpenId(id), loading ? 900 : 0);
      return () => clearTimeout(t);
    }
  }, [location.hash, loading]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = SPECIES.filter((s) =>
      (s.name.toLowerCase().includes(q) || s.sci.toLowerCase().includes(q)) &&
      (filter === 'all' || s.cat === filter)
    );
    list = [...list];
    if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === 'status') list.sort((a, b) => b.statusRank - a.statusRank);
    return list;
  }, [search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const openSpecies = SPECIES.find((s) => s.id === openId);

  const clearFilters = () => { setSearch(''); setFilter('all'); setPage(1); };
  const goToPage = (p) => {
    setPage(p);
    document.getElementById('resultCount')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Seo
        title="Wildlife Encyclopedia — WildLens"
        description="Browse a curated field guide of species — habitats, diets, conservation status, and interesting facts for mammals, birds, reptiles, insects, and more."
        path="/encyclopedia"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'WildLens Wildlife Encyclopedia', url: `${SITE_ORIGIN}/encyclopedia` }}
      />

      <header className="page-hero">
        <div className="container-wl">
          <span className="kicker" data-aos="fade-up"><i className="bi bi-journal-bookmark"></i> Wildlife Encyclopedia</span>
          <h1 className="mt-3" data-aos="fade-up" data-aos-delay="60" style={{ maxWidth: 640 }}>Explore the animal kingdom</h1>
          <p className="lede mt-2" style={{ maxWidth: 560 }} data-aos="fade-up" data-aos-delay="120">
            Browse our curated collection of species profiles — from apex predators to delicate pollinators. Habitats, diets, conservation status, and more.
          </p>
        </div>
      </header>

      <section className="pb-5">
        <div className="container-wl">
          <div className="row g-3 mb-4" data-aos="fade-up">
            <div className="col-12">
              <div className="search-wl">
                <i className="bi bi-search"></i>
                <input
                  type="text" placeholder="Search species by name…" aria-label="Search species"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap mb-2" data-aos="fade-up" data-aos-delay="60">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`tag-pill${filter === f ? ' active' : ''}`}
                onClick={() => { setFilter(f); setPage(1); }}
              >
                {f === 'all' && <i className="bi bi-funnel me-1"></i>}{f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
            <span className="spec-tag" id="resultCount">Showing {loading ? 0 : filtered.length} species</span>
            <div className="sort-select-wrap">
              <select aria-label="Sort species" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="az">Name A–Z</option>
                <option value="za">Name Z–A</option>
                <option value="status">Conservation Status</option>
              </select>
              <i className="bi bi-chevron-down"></i>
            </div>
          </div>

          {loading && (
            <div className="row g-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="col-12 col-sm-6 col-lg-4" key={i}>
                  <div className="skeleton-card">
                    <div className="skeleton skeleton-media"></div>
                    <div className="skeleton skeleton-line w60"></div>
                    <div className="skeleton skeleton-line w40"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="ic"><i className="bi bi-binoculars"></i></div>
              <h3>No species found</h3>
              <p>Try a different search term or clear your filters to see the full field guide.</p>
              <button className="btn-wl btn-outline-wl mt-3" onClick={clearFilters}><i className="bi bi-arrow-counterclockwise"></i> Clear filters</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="row g-4">
                {pageItems.map((s) => (
                  <div className="col-12 col-sm-6 col-lg-4" key={s.id}>
                    <div className="card-wl reticle h-100" style={{ cursor: 'pointer' }} onClick={() => setOpenId(s.id)}>
                      <div className="rt-corner tl"></div><div className="rt-corner tr"></div><div className="rt-corner bl"></div><div className="rt-corner br"></div>
                      <div className={`card-media species-art ${s.tone}`}>
                        <div className="badge-overlay badge-wl badge-neutral">{s.cat}</div>
                        <div className="card-actions">
                          <button className="icon-chip" aria-label={`Save ${s.name}`} onClick={(e) => { e.stopPropagation(); requireAuth(() => show('Saved to your collection')); }}>
                            <i className="bi bi-heart"></i>
                          </button>
                          <button className="icon-chip" aria-label={`Share ${s.name}`} onClick={(e) => { e.stopPropagation(); show('Link copied'); }}>
                            <i className="bi bi-share"></i>
                          </button>
                        </div>
                        <div className="specimen-latin">{s.sci}</div>
                        <EncyclopediaArt artKey={s.key} />
                      </div>
                      <div className="card-body">
                        <h3>{s.name}</h3>
                        <p className="sci-name">{s.sci}</p>
                        <span className={`badge-wl ${s.statusClass} mt-2`}>{s.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="wl-pagination mt-5">
                  <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}><i className="bi bi-chevron-left"></i></button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} className={currentPage === i + 1 ? 'active' : ''} onClick={() => goToPage(i + 1)}>{i + 1}</button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}><i className="bi bi-chevron-right"></i></button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Modal open={!!openSpecies} onClose={() => setOpenId(null)} dialogClassName="modal-dialog-centered modal-lg">
        {openSpecies && (
          <>
            <div className={`detail-gallery species-art ${openSpecies.tone}`}>
              <button type="button" className="btn-icon-wl position-absolute" style={{ top: 16, right: 16, zIndex: 5 }} aria-label="Close" onClick={() => setOpenId(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="specimen-latin">{openSpecies.sci}</div>
              <EncyclopediaArt artKey={openSpecies.key} />
            </div>
            <div className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div><h2 style={{ fontSize: '1.9rem', marginBottom: 2 }}>{openSpecies.name}</h2><p className="sci-name" style={{ fontStyle: 'italic' }}>{openSpecies.sci}</p></div>
                <span className={`badge-wl ${openSpecies.statusClass}`}>{openSpecies.status}</span>
              </div>
              <div className="stat-pill-row mt-3">
                <div className="stat-pill"><div className="l">Class</div><div className="v">{openSpecies.class}</div></div>
                <div className="stat-pill"><div className="l">Lifespan</div><div className="v">{openSpecies.lifespan}</div></div>
                <div className="stat-pill"><div className="l">Weight</div><div className="v">{openSpecies.weight}</div></div>
                <div className="stat-pill"><div className="l">Diet</div><div className="v">{openSpecies.diet}</div></div>
              </div>
              <div className="row g-4 mt-2">
                <div className="col-12 col-md-6">
                  <h6 className="spec-tag text-uppercase mb-2">Habitat</h6><p style={{ fontSize: '0.92rem' }}>{openSpecies.habitat}</p>
                  <h6 className="spec-tag text-uppercase mb-2 mt-3">Diet</h6><p style={{ fontSize: '0.92rem' }}>{openSpecies.dietText}</p>
                  <h6 className="spec-tag text-uppercase mb-2 mt-3">Conservation</h6><p style={{ fontSize: '0.92rem' }}>{openSpecies.conservation}</p>
                </div>
                <div className="col-12 col-md-6">
                  <h6 className="spec-tag text-uppercase mb-2">Interesting Facts</h6>
                  {openSpecies.facts.map((f, i) => (
                    <div className="fact-item" key={i}><span className="fact-num">{String(i + 1).padStart(2, '0')}</span><p className="mb-0" style={{ fontSize: '0.92rem' }}>{f}</p></div>
                  ))}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <button className="btn-wl btn-primary-wl btn-sm-wl" onClick={() => requireAuth(() => show('Saved to your collection'))}><i className="bi bi-heart"></i> Save</button>
                <button className="btn-wl btn-outline-wl btn-sm-wl" onClick={() => show('Link copied')}><i className="bi bi-share"></i> Share</button>
                <Link to="/identify" className="btn-wl btn-ghost-wl btn-sm-wl"><i className="bi bi-camera"></i> Identify one like this</Link>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
