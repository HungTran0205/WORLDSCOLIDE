/**
 * Consumer hook for the atmospheric stack. Returns `null` when the user has
 * disabled the system (low tier opt-out) — consumers must guard for it.
 */

import { useContext } from 'react';
import { AtmosphereContext } from './atmosphere-context-store';
import type { AtmospherePreset } from './atmosphere-types';

export function useAtmosphere(): AtmospherePreset | null {
  return useContext(AtmosphereContext);
}
