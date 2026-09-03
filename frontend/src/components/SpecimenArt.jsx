import speciesArt from '../data/speciesArt.json';

/**
 * Renders one of the hand-drawn generative-SVG species icons from the
 * original static pages. Uses dangerouslySetInnerHTML rather than
 * hand-translating every SVG attribute (stroke-width -> strokeWidth, etc.)
 * to JSX — the source markup is static, non-interactive decorative art
 * extracted verbatim from the original HTML, so this keeps 1:1 visual
 * fidelity with zero risk of a mistranslated attribute silently breaking
 * the illustration. `name` is one of the keys in data/speciesArt.json.
 */
export default function SpecimenArt({ name, ...props }) {
  const inner = speciesArt[name];
  if (!inner) return null;
  return (
    <svg
      className="specimen-svg"
      viewBox="0 0 240 240"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
      {...props}
    />
  );
}
