# Phase 03 — Cleanup & Document

**Status**: ✅ Done — 2026-05-09
**Effort**: ~1h
**Depends on**: phase-02 (refactor verified working)

---

## Goal

Cleanup dead workaround comments trong combat-idle-sprite.tsx, update file header docstring, document known limitation cho woodcutting/working animator (chưa fix nhưng có cùng tiềm ẩn bug), update changelog.

## Cleanup Targets

### `src/scene/combat/combat-idle-sprite.tsx`
Sau Phase 02, các comment sau **không còn đúng** và phải xóa hoặc rewrite:

**REMOVE** — comment giải thích workaround đã bị thay thế:
```tsx
// WebGPU NodeMaterial does NOT re-read texture.matrix on offset/repeat
// mutation alone — without this reassign, the GPU keeps the UV uniform
// from material setup and the sprite stays on frame 0 visually even
// though the loop advances frameIndexRef. Same workaround used by
// sprites/woodcutting-animator.tsx + sprites/working-animator.tsx,
// both of which animate correctly in this WebGPU build.
```

**REWRITE** — file header docstring:
```tsx
/**
 * Combat-panel single-entity sprite — idle loop + death animation + hit flash.
 *
 * Uses a per-entity NodeMaterial/ShaderMaterial with uniform-driven UV remap
 * (see idle-sprite-material.ts) to bypass WebGPU NodeMaterial's texture.matrix
 * dedupe behavior. Each entity has its own uvRect uniform — no cross-instance
 * uniform sharing, animation advances independently for every sprite.
 *
 * Atlas swap (idle/attack/death) updates the map uniform; UV update happens
 * every frame via handle.setUvRect(...). Tint (flash/dim/normal) routed through
 * handle.setTint instead of material.color.
 *
 * Pre-conditions:
 * - Camera + lighting are mounted by `<CombatScene>` (parent fragment).
 * - Resolver always returns *some* path — never 404 — so useLoader can't
 *   throw on missing assets (graceful degrade to walking-frame-0 fallback).
 */
```

**REWRITE** — JSX comment thay cho meshStandardMaterial block (đã đổi sang `<primitive>`):
```tsx
{/* Material handle from idle-sprite-material.ts — async-loaded so handle may
    be null on first render. Parent <Suspense> covers texture loading; this
    null-guard covers the brief NodeMaterial async build window. */}
```

### `src/scene/sprites/sprite-atlas.ts`
Add docstring trên `getAtlasFrameUv`:
```ts
/**
 * Pure UV calculation for a frame in the atlas — sharable across both the
 * texture-matrix path (setAtlasFrame, used by guild hall animators) and the
 * uniform path (combat panel idle sprite). No side effects; safe to call per
 * frame in render loops.
 */
```

## Documentation Updates

### `docs/project-changelog.md`
Add entry vào section gần nhất (May 2026):
```markdown
### 2026-05-09 — Combat Panel Multi-Instance Animation Fix

**Bug**: Trong combat panel idle, khi spawn ≥2 entity cùng spriteId, chỉ 1 sprite chạy idle animation liên tiếp; các sprite khác đứng yên 1 frame và chỉ "nhảy" khi nhận damage.

**Root cause**: WebGPU NodeMaterial trong Three.js r175 không re-upload texture.matrix uniform đồng thời cho nhiều material instance cùng pipeline cache. `texture.offset/repeat` mutation chỉ effective cho 1 material per frame.

**Fix**: Thêm `idle-sprite-material.ts` — per-entity NodeMaterial (WebGPU) / ShaderMaterial (WebGL) với uniform `uUvRect: vec4` driving UV remap trong shader. Mỗi entity có riêng material + uniform → no cross-instance state sharing.

**Files**:
- NEW: `src/scene/combat/idle-sprite-material.ts`
- MODIFIED: `src/scene/combat/combat-idle-sprite.tsx` (uniform UV instead of texture.matrix)
- MODIFIED: `src/scene/sprites/sprite-atlas.ts` (added `getAtlasFrameUv` helper)

**Known similar bug** (DEFERRED): `sprite-animator.tsx`, `woodcutting-animator.tsx`, `working-animator.tsx` cùng pattern (texture.offset/repeat). Guild hall thường có 1-2 instance cùng lúc nên symptom không lộ; nếu sau này có cảnh nhiều worker cùng spriteId, port pattern uniform UV.
```

### `docs/codebase-summary.md` (nếu có section sprite)
Search section "sprite" / "combat" và update mention về uniform UV pattern, link sang `idle-sprite-material.ts`.

### `docs/system-architecture.md`
Search section liên quan WebGPU/rendering. Nếu có note về texture animation, update để nhắc workaround mới.

## Known Limitation Note

Trong `src/scene/sprites/sprite-animator.tsx` và 2 file animator khác, thêm comment top-of-file (KHÔNG sửa code, chỉ note):
```tsx
/**
 * NOTE: Uses texture.offset/repeat for UV animation. WebGPU NodeMaterial may
 * not propagate UV updates reliably for multi-instance same-pipeline materials
 * (see combat-idle-sprite.tsx fix history). Symptom is hidden here because
 * guild hall typically has 1-2 instances per spriteId. If a scene with N≥3
 * matching sprites is added, port the uniform UV pattern from idle-sprite-material.ts.
 */
```

## Todo

- [x] Remove obsolete workaround comment trong `combat-idle-sprite.tsx` (đã làm trong phase 2 khi refactor)
- [x] Rewrite file header docstring `combat-idle-sprite.tsx` (đã làm trong phase 2)
- [x] Rewrite JSX inline comment cho material primitive (đã làm trong phase 2)
- [x] Add docstring trên `getAtlasFrameUv` trong `sprite-atlas.ts` (đã làm trong phase 1)
- [x] Add changelog entry trong `docs/project-changelog.md` (v1.27.6 entry)
- [x] Add deferred-bug note trong `sprite-animator.tsx`, `woodcutting-animator.tsx`, `working-animator.tsx`
- [~] Update `docs/system-architecture.md` — SKIPPED: sprite section không có chi tiết về animation pipeline; thông tin đầy đủ đã ở changelog
- [~] Update `docs/codebase-summary.md` — SKIPPED: sprite section reference outdated paths (pre-scene-reorg) → out of scope
- [x] Final TypeScript clean (exit 0)
- [x] Final commit message preview (đã có trong section "Commit Message")

## Success Criteria

- [ ] Không còn comment claim "workaround works" về setAtlasFrame trong combat-idle-sprite
- [ ] Changelog có entry rõ ràng về fix + reasoning
- [ ] Note ở 3 animator khác cảnh báo về same-pattern bug tiềm ẩn
- [ ] Không file doc nào reference InstancedSpriteRenderer như fix path (vì panel idle KHÔNG dùng instancing per D1)

## Commit Message (preview)

```
fix(combat): multi-instance idle sprite animation via uniform UV remap

Previous behavior: only 1 of N entities sharing the same spriteId rendered
continuous idle animation; others froze on a single frame and "jumped" only
when their HP changed (which incidentally invalidated the bind group).

Root cause: WebGPU NodeMaterial in Three.js r175 does not re-upload
texture.matrix uniform for multiple material instances sharing pipeline
cache when only texture.offset/repeat mutate. The previous mat.map = atlas.texture
reassignment was a no-op (same reference) and never broke the cache.

Fix: introduce idle-sprite-material.ts factory building per-entity
NodeMaterial (WebGPU) / ShaderMaterial (WebGL) with uniform uUvRect: vec4.
combat-idle-sprite.tsx now updates the uniform per frame instead of mutating
texture.offset/repeat. Atlas texture is still shared via map binding; only
UV uniform differs per entity, so each animation advances independently.

Aligns with plan-260503-1123 D1 (panel does NOT use GPU instancing) and
keeps the simple per-entity mesh architecture intact.

Files:
- new src/scene/combat/idle-sprite-material.ts
- mod src/scene/combat/combat-idle-sprite.tsx
- mod src/scene/sprites/sprite-atlas.ts (extract getAtlasFrameUv helper)
```

## Out of Scope

- Fix sprite-animator/woodcutting/working — defer (symptom hidden, low priority)
- Performance benchmarking (combat panel scale là 6-12 entity, không cần optimize)
- Refactor sprite-material.ts (instanced renderer code, plan riêng sẽ delete)
