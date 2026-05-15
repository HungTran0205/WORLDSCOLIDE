# Phase 02 — Integrate Material & Verify Multi-Instance Animation

**Status**: 🟡 Code complete — pending manual smoke test
**Effort**: ~2-3h
**Depends on**: phase-01

---

## Goal

Refactor [combat-idle-sprite.tsx](../../src/scene/combat/combat-idle-sprite.tsx) dùng `createIdleSpriteMaterial` từ Phase 01. Bỏ `<meshStandardMaterial>` JSX + `setAtlasFrame()` calls; thay bằng async material handle + uniform updates per frame.

## Context Links

- [phase-01-uv-uniform-material.md](phase-01-uv-uniform-material.md) — material factory output
- [combat-idle-sprite.tsx](../../src/scene/combat/combat-idle-sprite.tsx) — file to refactor
- [instanced-sprite-renderer.tsx:88-97](../../src/scene/combat/instanced-sprite-renderer.tsx#L88-L97) — async material loading pattern (placeholder → real material via `useState`)

## Architecture Changes

### Before (current — bug)
```tsx
const idleAtlas = useMemo(() => buildAtlasFromTextures(idleTextures, ...), [idleTextures]);
// ...
useFrame(() => {
  // ...
  setAtlasFrame(atlas, frameIdx);    // mutates atlas.texture.offset/repeat → not propagated by WebGPU
  mat.map = atlas.texture;           // no-op (same reference)
  mat.needsUpdate = false;            // no-op (default)
});
return (
  <mesh>
    <meshStandardMaterial ref={materialRef} map={idleAtlas.texture} ... />
  </mesh>
);
```

### After (fix)
```tsx
const idleAtlas = useMemo(() => buildAtlasFromTextures(idleTextures, ...), [idleTextures]);
const { gl } = useThree();
const [handle, setHandle] = useState<IdleSpriteMaterialHandle | null>(null);

useEffect(() => {
  let cancelled = false;
  createIdleSpriteMaterial(idleAtlas.texture, gl).then((h) => {
    if (cancelled) { h.dispose(); return; }
    setHandle(h);
  });
  return () => { cancelled = true; handle?.dispose(); };
}, [idleAtlas.texture, gl]);

useFrame(() => {
  if (!handle) return;
  // ... same animation state machine ...
  const { u, v, w, h: uvH } = getAtlasFrameUv(currentAtlas, frameIndexRef.current);
  handle.setUvRect(u, v, w, uvH);
  handle.setMap(currentAtlas.texture);   // swap atlas idle ↔ attack ↔ death
  handle.setTint(tint.r, tint.g, tint.b);
});

return (
  <mesh ref={meshRef} ...>
    <planeGeometry args={[1, 1]} />
    {handle && <primitive object={handle.material} attach="material" />}
  </mesh>
);
```

### Key changes
1. Material là **async load** — render `<mesh>` không có material cho tới khi handle ready (Suspense boundary có sẵn ở `CombatEntityLayer`)
2. UV update qua `handle.setUvRect(u, v, w, h)` thay vì `setAtlasFrame()`
3. Atlas swap (idle/attack/death) qua `handle.setMap(texture)` thay vì `mat.map = ... ; mat.needsUpdate = true`
4. Tint (flash/dead/normal) qua `handle.setTint(r, g, b)` thay vì `mat.color.copy(...)`
5. Cleanup: `handle.dispose()` khi unmount (entity die + remove)

### Reuse existing logic
- Animation state machine (idle/attack/death transitions, frame index advance, death freeze) **giữ nguyên** — chỉ thay output sink
- Foreshortening + ground anchor (`getCombatSpriteScale`, `mesh.position.y = liveScale * 0.5`) **giữ nguyên**
- Hit flash timing (`flashUntilRef`, `FLASH_DURATION_MS`) **giữ nguyên**
- Path resolver `useCombatSpritePaths` **giữ nguyên**

## Implementation Steps

### Step 1: Update imports
```tsx
// REMOVE
import { TextureLoader, MeshStandardMaterial, Mesh, Color } from 'three';
import { buildAtlasFromTextures, setAtlasFrame } from '@/scene/sprites/sprite-atlas';

// ADD
import { TextureLoader, Mesh, Color } from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildAtlasFromTextures, getAtlasFrameUv } from '@/scene/sprites/sprite-atlas';
import { createIdleSpriteMaterial, type IdleSpriteMaterialHandle } from './idle-sprite-material';
```

### Step 2: Replace material refs
```tsx
// REMOVE
const materialRef = useRef<MeshStandardMaterial>(null);

// ADD
const { gl } = useThree();
const [handle, setHandle] = useState<IdleSpriteMaterialHandle | null>(null);
```

### Step 3: Async material init
Mount handle khi atlas đầu tiên (idle) ready. Atlas swap (death/attack) chỉ đổi `setMap` value, không tạo material mới.
```tsx
useEffect(() => {
  let cancelled = false;
  let createdHandle: IdleSpriteMaterialHandle | null = null;
  createIdleSpriteMaterial(idleAtlas.texture, gl).then((h) => {
    if (cancelled) { h.dispose(); return; }
    createdHandle = h;
    setHandle(h);
  });
  return () => {
    cancelled = true;
    if (createdHandle) createdHandle.dispose();
  };
}, [idleAtlas.texture, gl]);
```

### Step 4: Refactor useFrame body
Thay block "Pick atlas + advance frame" cuối:

```tsx
// REPLACE
if (mat.map !== atlas.texture) {
  mat.map = atlas.texture;
  mat.needsUpdate = true;
}
// ... frame advance logic (KEEP) ...
setAtlasFrame(atlas, frameIndexRef.current);
mat.map = atlas.texture;
mat.needsUpdate = false;
// ... tint logic (KEEP) ...
mat.color.copy(FLASH_COLOR);  // etc

// WITH
if (!handle) return;
// ... frame advance logic (KEEP — no change) ...
const uvFrame = getAtlasFrameUv(atlas, frameIndexRef.current);
handle.setUvRect(uvFrame.u, uvFrame.v, uvFrame.w, uvFrame.h);
handle.setMap(atlas.texture);   // cheap — only re-assigns uniform if changed in shader

// Tint
const now = performance.now();
if (now < flashUntilRef.current) {
  handle.setTint(FLASH_COLOR.r, FLASH_COLOR.g, FLASH_COLOR.b);
} else if (isDead && deathFrozenRef.current) {
  handle.setTint(DEAD_COLOR.r, DEAD_COLOR.g, DEAD_COLOR.b);
} else {
  handle.setTint(1, 1, 1);
}
```

### Step 5: Update JSX return
```tsx
return (
  <mesh
    ref={meshRef}
    position={[entity.position.x, initialScale * 0.5, entity.position.z]}
    rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
    scale={[initialScale, initialScale, 1]}
  >
    <planeGeometry args={[1, 1]} />
    {handle && <primitive object={handle.material} attach="material" />}
  </mesh>
);
```

### Step 6: Remove constants không còn dùng
```tsx
// Có thể xóa nếu không reference
// const FLASH_COLOR = new Color(2.4, 2.4, 2.4);  // KEEP — vẫn dùng cho .r/.g/.b
// const DEAD_COLOR = new Color(0.7, 0.7, 0.7);   // KEEP
// const NORMAL_COLOR = new Color(1, 1, 1);       // có thể xóa, replace bằng setTint(1,1,1)
```

## Verification

### Manual smoke test (REQUIRED)
1. `npm run dev` → mở app
2. Trigger combat với mission có **6+ slime + 1+ ally**
3. Watch combat panel cho ≥10 giây — TẤT CẢ sprite phải animate độc lập
4. Damage 1 slime → flash + frame tiếp tục advance smooth
5. Kill 1 slime → death anim play through, freeze frame cuối, không ảnh hưởng slime khác
6. Trigger ally attack → attack anim restart frame 0, transition về idle khi xong

### Console check
- Không có WebGPU warning về uniform binding
- Không có Three.js warning về material disposal
- React: không có "Cannot update unmounted component" khi entity die

### Visual diff
- So với commit trước (`HEAD`): sprite scale, position, foreshortening, alpha, transparency tất cả phải identical
- Pixel art crispness giữ nguyên (NEAREST filter inherited from atlas)

### Negative test (regression)
- Guild hall sprite (`SpriteAnimator`) vẫn animate đúng — không touch
- Woodcutting/working animator vẫn animate đúng — không touch

## Todo

- [x] Update imports trong `combat-idle-sprite.tsx`
- [x] Add `useThree` + `useState` cho handle async load
- [x] Replace `materialRef` usage với `handle`
- [x] Move `setAtlasFrame` calls → `handle.setUvRect(getAtlasFrameUv(...))`
- [x] Replace `mat.color.copy(...)` → `handle.setTint(r, g, b)`
- [x] JSX: thay `<meshStandardMaterial>` bằng `<primitive object={handle.material} attach="material" />`
- [x] TypeScript compile clean (exit 0)
- [x] Code review (DONE 8.5/10, no blockers)
- [ ] Manual test: 6+ slime animate độc lập
- [ ] Manual test: death anim freeze frame cuối
- [ ] Manual test: hit flash chuẩn
- [ ] Manual test: attack/skill transition restart frame
- [ ] Verify no regression ở guild hall sprites

## Code Review Notes (2026-05-09)

Reviewer score 8.5/10, status DONE. Verified:
- ✓ useEffect cleanup race handled correctly via `cancelled` flag + `createdHandle` capture
- ✓ State refs not advancing during async load is SAFE (death-enter resets frame; lastHpRef updated in separate useEffect; lastAnimStateRef triggers transition reset on first frame post-handle-ready)
- ✓ R3F `<primitive>` reconciliation correct, no leak
- ✓ No ally/enemy facing regression
- ✓ Atlas swap optimization (`lastMapRef`) seeded correctly inside `.then()` before `setHandle`

Open runtime verification (resolves only via manual test):
- WebGPU `mapNode.value = tex` swap on first kill (idle→death transition)
- 1-2 frame invisible-sprite window between texture-ready and material-ready (acceptable per spec)

## Success Criteria

- [ ] Multi-instance idle animation chạy độc lập per entity (PRIMARY GOAL)
- [ ] Death/hit/attack feedback giữ nguyên behavior
- [ ] Không introduce React warning về unmount/disposal
- [ ] Không introduce Three.js material warning
- [ ] Compile clean

## Risks

| Risk | Mitigation |
|---|---|
| `<primitive object={handle.material}>` không attach đúng cho R3F v9 | Test với simple mesh trước; fallback dùng `<mesh material={handle.material}>` JSX prop |
| Async material → 1-frame delay khi mount, sprite invisible briefly | Acceptable (parent đã có Suspense fallback null); add placeholder MeshBasicMaterial nếu pop quá rõ |
| `handle.dispose()` race khi unmount + atlas swap đồng thời | Track `cancelled` ref trong useEffect cleanup; dispose chỉ nếu `createdHandle` đã set |
| Memory leak: 1 material per entity, entity die → unmount → dispose | useEffect cleanup gọi `handle.dispose()`; Three.js auto-collect GPU resource |
| Tint Color object có .r/.g/.b properties? | THREE.Color có — verify `Color(2.4, 2.4, 2.4).r === 2.4`; nếu không, expose Vector3 hoặc dùng raw number constants |

## Next Phase

→ [phase-03-cleanup-and-document.md](phase-03-cleanup-and-document.md) — cleanup dead code + update doc
