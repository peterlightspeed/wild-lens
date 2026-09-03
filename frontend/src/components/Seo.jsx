import { Helmet } from 'react-helmet-async';

// Set this to your real deployed origin before going live (also update
// sitemap.xml / robots.txt / the JSON-LD below). Kept as one constant so
// there's a single place to change it.
export const SITE_ORIGIN = 'https://peterlightspeed.github.io/wild-lens';

/**
 * Per-route SEO tags. Pass `noindex` for auth pages (mirrors the static
 * site's login.html/signup.html <meta name="robots" content="noindex, nofollow">).
 * `jsonLd` accepts one schema.org object or an array of them.
 */
export default function Seo({ title, description, path = '/', noindex = false, jsonLd }) {
  const url = `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE_ORIGIN}/icons/icon-512.png`} />
      <meta name="twitter:card" content="summary" />
      {ldArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}
