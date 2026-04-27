/**
 * Debug mode flag — controls visibility of Leva debug panels and combat log download.
 *
 * Enable via:
 *   1. Build-time: set VITE_DEBUG_MODE=true in .env.local
 *   2. Runtime:    localStorage.setItem('wc_debug', '1') then reload
 *
 * Always false in production regardless of env vars.
 */
export const DEBUG_MODE =
  import.meta.env.DEV &&
  (import.meta.env.VITE_DEBUG_MODE === 'true' ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('wc_debug') === '1'));
