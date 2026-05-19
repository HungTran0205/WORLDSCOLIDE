/**
 * Title-screen asset preloader hook.
 * Preloads PNG textures + GLB models in parallel so the title scene mounts
 * without flash or frame drops. Returns {ready, progress} for splash UI.
 *
 * Asset selection mirrors Phase 1 + Phase 3 picks:
 *   - Linh Son guild hall walls (back + left)
 *   - Copper drum + fire holder GLB
 *   - 5 mask PNGs (gasf + half mix)
 *   - 5 character `rotations/south.png` portraits (1 per civ + 2 mix)
 *
 * Note: GLB warm-up uses fetch() (not useGLTF.preload) so progress updates
 * fire incrementally. Drei caches the response when useGLTF runs later.
 */

import { useEffect, useState } from 'react';

/** PNG assets — loaded via Image() */
const ASSETS_PNG = [
  // Walls — title scene uses a dedicated cinematic back-wall sprite
  // (titlewallback) while reusing the in-game left wall for the corner.
  '/GuildHall/LinhSon/titlewallback.png',
  '/GuildHall/LinhSon/wall-left.png',

  // 5 mask sprite picks
  '/sprites/mask/pick/mask-056.png',
  '/sprites/mask/half-mask10.png',
  '/sprites/mask/gasf-mask20.png',
  '/sprites/mask/gasf-mask30.png',
  '/sprites/mask/half-mask15.png',

  // 5 character portraits — Linh Son only (ritualistic scene = LS guild hall).
  // Only 4 unique LS chars exist (SCOUT-F/M, WARRIOR-F/M); 5th slot reuses
  // SCOUT-M at a different rotation — different mask makes it read as new figure.
  // WARRIOR-F/M lack rotations/ folder, so walk south frame_000 is used instead.
  '/sprites/characters/LS-SCOUT-M/rotations/south.png',
  '/sprites/characters/LS-SCOUT-F/rotations/south.png',
  '/sprites/characters/LS-WARRIOR-M/animations/avatar/frame_000.png',
  '/sprites/characters/LS-WARRIOR-M/animations/walking-8-frames/south/frame_000.png',
  '/sprites/characters/LS-WARRIOR-F/animations/walking-8-frames/south/frame_000.png',
  '/sprites/characters/LS-SCOUT-M/rotations/south-east.png',
] as const;

/** GLB assets — warmed via fetch (drei caches on later useGLTF) */
const ASSETS_GLB = [
  '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb',
] as const;

const TOTAL_ASSETS = ASSETS_PNG.length + ASSETS_GLB.length;

export interface TitlePreloaderState {
  ready: boolean;
  progress: number;
}

export function useTitlePreloader(): TitlePreloaderState {
  const [state, setState] = useState<TitlePreloaderState>({ ready: false, progress: 0 });

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;

    const bump = (label: string) => {
      loaded += 1;
      console.log(`[Preloader] ${loaded}/${TOTAL_ASSETS} ←`, label);
      if (cancelled) return;
      setState((s) => ({ ...s, progress: loaded / TOTAL_ASSETS }));
    };

    const pngPromises = ASSETS_PNG.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          // Resolve on both load + error so a single 404 cannot block forever.
          img.onload = () => { bump(`PNG ok ${src}`); resolve(); };
          img.onerror = () => { bump(`PNG err ${src}`); resolve(); };
          img.src = src;
        }),
    );

    const glbPromises = ASSETS_GLB.map((src) =>
      fetch(src)
        .catch(() => undefined)
        .finally(() => { bump(`GLB ${src}`); }),
    );

    Promise.all([...pngPromises, ...glbPromises]).then(() => {
      console.log('[Preloader] all settled — ready=true');
      if (cancelled) return;
      setState({ ready: true, progress: 1 });
    });

    return () => { cancelled = true; };
  }, []);

  return state;
}
