/**
 * Rocky cave decor and info card for the 7×7 stone-quarry facility room.
 * Uses cave arena GLBs — same pattern as ForestRoomDecor.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcMcLevel } from '@/game/systems/stone-quarry-production-system';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';

// Preload cave props
useGLTF.preload('/arena/cave/3dprops/p_stonepilla.glb');
useGLTF.preload('/arena/cave/3dprops/p_stone_pillar_falling.glb');
useGLTF.preload('/arena/cave/3dprops/p_standing_torch.glb');

/** Scaled GLB placed at world-space position */
function CaveProp({ path, position, targetHeight, rotY = 0 }: {
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

/** Compact info card — pinned to top-left corner of the stone-quarry room */
export function QuarryZoneCard({ facility }: { facility: GuildFacility }) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;
  const assigned = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
  const lv = facility.level;
  const levelMult = STONE_QUARRY_CONFIG.levelMult[lv - 1];

  let totalStonePerDay = 0;
  for (const m of assigned) {
    const baseScore = m.stats.STR * 0.5;
    const mcXp = m.craftSkills?.mining?.xpAccumulated ?? 0;
    const mcLevel = calcMcLevel(mcXp);
    const yieldMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[mcLevel] / 100;
    totalStonePerDay +=
      STONE_QUARRY_CONFIG.baseRate * (baseScore / 100) * levelMult * yieldMult * STONE_QUARRY_CONFIG.ticksPerDay;
  }

  return (
    <div style={{
      background: 'rgba(18,18,22,0.88)',
      border: '1px solid rgba(160,160,200,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 170,
      fontSize: 12,
      color: '#d0d0e0',
    }}>
      <div style={{ fontWeight: 'bold', color: '#c8c8f0', marginBottom: 6 }}>
        Stone Quarry — Lv.{lv}
      </div>
      {assigned.length > 0 ? (
        <>
          <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: 2 }}>
            ~{Math.floor(totalStonePerDay)} stone/day
          </div>
          <div style={{ color: '#888', fontSize: 11 }}>
            {assigned.length} miner{assigned.length > 1 ? 's' : ''} assigned
          </div>
        </>
      ) : (
        <div style={{ color: '#666', fontSize: 11 }}>No miners assigned</div>
      )}
    </div>
  );
}

/** Stone pillar clusters and torches for the stone-quarry room */
export function QuarryRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Pillar clusters at back corners */}
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx - 2.6, 0, cz - 2.5]} targetHeight={3.5} rotY={0.2} />
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx + 2.5, 0, cz - 2.4]} targetHeight={2.8} rotY={-0.4} />
      {/* Smaller pillar mid-left */}
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx - 2.4, 0, cz + 0.5]} targetHeight={1.8} rotY={0.8} />
      {/* Fallen pillar mid-back */}
      <CaveProp path="/arena/cave/3dprops/p_stone_pillar_falling.glb" position={[cx + 0.6, 0, cz - 1.8]} targetHeight={1.0} rotY={0.3} />
      {/* Standing torches on side walls */}
      <CaveProp path="/arena/cave/3dprops/p_standing_torch.glb"       position={[cx - 2.8, 0, cz - 0.5]} targetHeight={1.6} rotY={0} />
      <CaveProp path="/arena/cave/3dprops/p_standing_torch.glb"       position={[cx + 2.8, 0, cz - 0.5]} targetHeight={1.6} rotY={0} />
    </group>
  );
}
