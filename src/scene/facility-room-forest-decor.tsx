/**
 * Forest decor and logging-site info card for the 7×7 logging-site facility room.
 * Extracted from facility-room.tsx to keep that file under 200 lines.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
import type { GuildFacility } from '@/game/state/game-state';

// Preload forest GLBs
[
  '/arena/forest/3dprops/p_tree_large.glb',
  '/arena/forest/3dprops/p_tree_pine.glb',
  '/arena/forest/3dprops/p_stump.glb',
  '/arena/forest/3dprops/p_log_fallen.glb',
  '/arena/forest/3dprops/p_bush.glb',
].forEach((p) => useGLTF.preload(p));

/** Single GLB model scaled to targetHeight, placed at world-space position */
function ForestProp({ path, position, targetHeight, rotY = 0 }: {
  path: string;
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
}) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Forest tree/stump scatter around the 7×7 logging-site room edges */
export function ForestRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Back cluster */}
      <ForestProp path="/arena/forest/3dprops/p_tree_large.glb" position={[cx - 2.2, 0, cz - 2.5]} targetHeight={4.2} rotY={0.3} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx + 1.8, 0, cz - 2.8]} targetHeight={3.8} rotY={-0.5} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 0.2, 0, cz - 3.0]} targetHeight={3.0} rotY={0.9} />
      {/* Side clusters */}
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 2.8, 0, cz + 0.5]} targetHeight={3.5} rotY={1.2} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 2.6, 0, cz - 1.2]} targetHeight={2.6} rotY={0.6} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx + 2.7, 0, cz - 1.5]} targetHeight={2.8} rotY={-1.0} />
      {/* Floor props */}
      <ForestProp path="/arena/forest/3dprops/p_stump.glb"      position={[cx + 1.0, 0, cz - 0.4]} targetHeight={0.6} rotY={0.8} />
      <ForestProp path="/arena/forest/3dprops/p_log_fallen.glb" position={[cx + 0.8, 0, cz + 2.0]} targetHeight={0.5} rotY={0.6} />
    </group>
  );
}

/** Compact floating card — pinned to top-back of room so characters in center stay visible */
export function LoggingSiteZoneCard({ facility }: { facility: GuildFacility }) {
  const reserve = facility.woodReserve ?? 0;
  const max = LOGGING_SITE_CONFIG.woodReserve;
  const pct = reserve / max;
  const isDepleted = reserve === 0;

  const barColor = isDepleted ? '#6b7280'
    : pct <= LOGGING_SITE_CONFIG.warningCriticalPct ? '#ef4444'
    : pct <= LOGGING_SITE_CONFIG.warningLowPct ? '#f59e0b'
    : '#4ade80';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,215,0,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 180,
      fontSize: 12,
      color: '#e0e0e0',
    }}>
      <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: 6 }}>
        Logging Site {isDepleted && <span style={{ color: '#6b7280', fontSize: 10 }}>DEPLETED</span>}
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(pct * 100).toFixed(1)}%`, background: barColor, borderRadius: 3 }} />
      </div>
      <div style={{ color: '#aaa', fontSize: 11 }}>
        {Math.floor(reserve)}/{max} wood {isDepleted ? '— tap to remove' : ''}
      </div>
    </div>
  );
}
