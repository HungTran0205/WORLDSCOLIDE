/**
 * DEV-only anchor tuner for combat mask compositing.
 *
 * Mounted by <CombatSceneShell> when import.meta.env.DEV is true.
 * Adjust x/y/size sliders, then click "apply" to update the in-memory anchor
 * table and dispose the cached composite atlas for that char so the next
 * render rebuilds with new values.
 *
 * Click "exportAnchors" to print the full anchor table to console — paste into
 * combat-mask-anchors.ts ANCHOR_TABLE to bake the values permanently.
 *
 * All controls are in one store so leva's `get` works across fields in the
 * button callback (cross-panel `get` does not work in leva).
 *
 * Renders nothing — leva UI only.
 */

import { useControls, button } from 'leva';
import {
  setDevAnchorOverride,
  getAnchorTable,
  type CombatMaskAnim,
} from './combat-mask-anchors';
import { invalidateCombatMaskCompositeByChar } from './combat-mask-composite-atlas';

const STORE = 'Combat / Mask Dev';

export function CombatMaskDevTuner() {
  useControls(
    STORE,
    {
      charId:     { value: 'LS-SWORD-M', options: ['LS-SWORD-M', 'LS-WARRIOR-M', 'LS-SCOUT-F'] },
      anim:       { value: 'idle',       options: ['idle', 'attack', 'blocking'] },
      frameIndex: { value: 0, min: 0, max: 7, step: 1 },
      x:    { value: 64, min: 0, max: 128, step: 1 },
      y:    { value: 40, min: 0, max: 128, step: 1 },
      size: { value: 38, min: 4, max: 80,  step: 1 },
      apply: button((get) => {
        const cid = get(`${STORE}.charId`) as string;
        const an  = get(`${STORE}.anim`)   as CombatMaskAnim;
        const fi  = get(`${STORE}.frameIndex`) as number;
        const ax  = get(`${STORE}.x`)    as number;
        const ay  = get(`${STORE}.y`)    as number;
        const as_ = get(`${STORE}.size`) as number;
        setDevAnchorOverride(cid, an, fi, { x: ax, y: ay, size: as_ });
        invalidateCombatMaskCompositeByChar(cid);
        console.log(`[MaskDev] ${cid} ${an} f${fi} → x:${ax} y:${ay} size:${as_}`);
      }),
      exportAnchors: button(() => {
        const tbl = getAnchorTable();
        console.log('[MaskDev] anchor table (paste into combat-mask-anchors.ts):');
        console.log(JSON.stringify(tbl, null, 2));
      }),
    },
    { collapsed: true },
  );

  return null;
}
