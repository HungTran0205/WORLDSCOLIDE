/**
 * StageRenderHost — generic projector that turns a CombatStageSpec into the
 * three named slots of <CombatSceneShell> (bg / ground / foreground). All
 * spec-driven combat scenes go through this host; per-stage components
 * collapse to a one-liner that resolves their spec and forwards it here.
 *
 * Slot composition (mirrors the pre-refactor lolo-village-outskirt scene):
 *   - bg:         <Suspense><CombatBgFar/><CombatBgMid/></Suspense>
 *   - ground:     opaque backdrop plane → <Suspense> wrapping the platform
 *                  set. Suspense covers texture loads on first stage open.
 *   - foreground: spec.foreground === 'none' → null
 *                 spec.foreground === 'default' (or unset) → <CombatFgDecorative>
 *
 * Backdrop plane: optional opaque fallback at z=spec.backdrop.z, sized
 * spec.backdrop.size. Sits behind all bg layers; guarantees no transparent
 * canvas pixel reveals the body / leaked guild scene through the panel.
 *
 * Note: bg layers (<CombatBgFar>, <CombatBgMid>) currently consume only
 * `texture` from BgLayer. Optional position/size/tint/alphaTest on BgLayer
 * are reserved for future per-stage tuning — extend the bg components when
 * a stage actually needs them.
 */

import { Suspense } from 'react';
import { CombatSceneShell } from '../combat-scene-shell';
import { CombatBgFar } from '../combat-bg-far';
import { CombatBgMid } from '../combat-bg-mid';
import { CombatFgDecorative } from '../combat-fg-decorative';
import { CombatPlatform } from '../platform/combat-platform';
import type { CombatStageSpec } from './stage-spec-types';

export interface StageRenderHostProps {
  spec: CombatStageSpec;
}

export function StageRenderHost({ spec }: StageRenderHostProps) {
  const { bgFar, bgMid, backdrop, platforms, foreground } = spec;

  return (
    <CombatSceneShell
      bg={
        <Suspense fallback={null}>
          <CombatBgFar texture={bgFar.texture} />
          <CombatBgMid texture={bgMid.texture} />
        </Suspense>
      }
      ground={
        <>
          {backdrop && (
            <mesh position={[0, 0, backdrop.z]}>
              <planeGeometry args={[backdrop.size, backdrop.size]} />
              <meshBasicMaterial color={backdrop.color} />
            </mesh>
          )}
          <Suspense fallback={null}>
            {platforms.map((p) => (
              <CombatPlatform key={p.id} platform={p} />
            ))}
          </Suspense>
        </>
      }
      foreground={foreground === 'none' ? null : <CombatFgDecorative />}
    />
  );
}
