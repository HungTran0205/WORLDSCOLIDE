/**
 * The Forest — phase 04 visual-validation stage component.
 *
 * Thin delegate to <StageRenderHost> — see `stages/the-forest.ts` for the
 * actual stage definition. This stage clones lolo-village-outskirt + adds a
 * raised "test-cliff" to eyeball side-wall visibility at the 22° camera tilt.
 *
 * Active for missions with zone === 'Deep Forest' (currently
 * "Forest Guardian"). Remove this file + zone mapping during phase 07
 * cleanup once phase 06 has the real demo stage.
 */

import { StageRenderHost } from './stage-render-host';
import { getStageSpec } from './combat-map-registry';

export function TheForestScene() {
  return <StageRenderHost spec={getStageSpec('the-forest')} />;
}
