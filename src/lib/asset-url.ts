/**
 * Resolve a public asset path against the app's deploy base so the build works
 * when served from a subpath (itch.io, GitHub Pages) or opened locally, not just
 * from the domain root. Idempotent — only rewrites leading-slash absolute paths;
 * leaves already-relative paths and full URLs (http/blob/data) untouched.
 */
export function assetUrl(path: string): string {
  if (!path || !path.startsWith('/')) return path;
  // BASE_URL is './' when vite base is './'  →  '/sprites/x' becomes './sprites/x'
  return import.meta.env.BASE_URL + path.slice(1);
}
