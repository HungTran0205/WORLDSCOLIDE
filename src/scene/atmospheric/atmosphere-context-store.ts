/**
 * Plain React Context for the atmospheric stack. Split out from
 * `atmosphere-context.tsx` so the Provider file can remain component-only
 * (react-refresh/only-export-components).
 */

import { createContext } from 'react';
import type { AtmospherePreset } from './atmosphere-types';

export const AtmosphereContext = createContext<AtmospherePreset | null>(null);
