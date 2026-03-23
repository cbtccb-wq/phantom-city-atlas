/**
 * urlSync.ts — Sync seed with URL hash for sharing
 * URL format: /#seed=12345
 */

export function getSeedFromUrl(): number | null {
  try {
    const hash = window.location.hash.slice(1); // remove '#'
    const params = new URLSearchParams(hash);
    const s = params.get('seed');
    if (!s) return null;
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

export function setSeedInUrl(seed: number) {
  const params = new URLSearchParams();
  params.set('seed', String(seed));
  history.replaceState(null, '', '#' + params.toString());
}

export function getShareUrl(seed: number): string {
  const params = new URLSearchParams();
  params.set('seed', String(seed));
  return `${location.origin}${location.pathname}#${params.toString()}`;
}
