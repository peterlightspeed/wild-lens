import art from '../data/encyclopediaArt.json';

/** Same technique as SpecimenArt.jsx — see that file's comment for why
 * dangerouslySetInnerHTML is used for this decorative, static SVG line-art. */
export default function EncyclopediaArt({ artKey, ...props }) {
  const inner = art[artKey];
  if (!inner) return null;
  return (
    <svg className="specimen-svg" viewBox="0 0 240 240" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }} {...props} />
  );
}
