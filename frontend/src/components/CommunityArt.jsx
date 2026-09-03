import art from '../data/communityArt.json';

export default function CommunityArt({ artKey, ...props }) {
  const inner = art[artKey];
  if (!inner) return null;
  return (
    <svg className="specimen-svg" viewBox="0 0 240 240" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }} {...props} />
  );
}
