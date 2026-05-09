---
title: "Fix Combat Idle Sprite Multi-Instance Animation (WebGPU UV Uniform)"
description: "Bypass WebGPU NodeMaterial texture.matrix dedupe bug by switching CombatIdleSprite to a per-entity NodeMaterial with uniform-driven UV remapping. Keep simple per-entity architecture (D1)."
status: completed
priority: P0
effort: 4-6h
branch: develop
tags: [combat, sprite, webgpu, bugfix, rendering]
created: 2026-05-09
blockedBy: []
blocks: []
---

# Combat Idle Sprite Multi-Instance Animation Fix

**Created**: 2026-05-09
**Branch**: `develop`
**Status**: 📋 Planning
**Priority**: P0 — combat visual bug, blocks playtest of new panel

---

## Problem

Trong combat panel mới (feature/combat-panel-idle), khi spawn nhiều entity cùng `spriteId` (vd 6 slime + 1 LS-SCOUT-M), **chỉ 1 sprite chạy idle animation liên tiếp**. Các sprite còn lại đứng yên 1 frame, chỉ "nhảy" sang frame mới khi entity nhận damage.

### Root cause (verified)

WebGPU NodeMaterial trong Three.js r175 không re-upload `texture.matrix` uniform cho tất cả material instance trong cùng pipeline cache. Khi N material cùng cấu hình (cùng `MeshStandardMaterial { roughness:1, metalness:0, transparent:true, alphaTest:0.1 }`) bind vào pipeline cache, chỉ 1 material được refresh UV uniform mỗi frame — các material khác giữ matrix cũ.

Khi HP entity giảm → React re-render → R3F mark mesh dirty → bind group invalidate → frame "nhảy" 1 lần.

### Tại sao "workaround" hiện tại không hoạt động

[combat-idle-sprite.tsx:212-213](../../src/scene/combat/combat-idle-sprite.tsx#L212-L213):
```js
mat.map = atlas.texture;     // === atlas.texture rồi → JS no-op
mat.needsUpdate = false;     // default đã false → vô nghĩa
```

Pattern này copy từ woodcutting-animator/working-animator — guild hall thường có 1-2 instance cùng lúc nên symptom bị che.

---

## Design Constraints (Locked)

Theo plan-260503-1123 D1 và design philosophy của combat panel idle:
- ❌ KHÔNG dùng InstancedSpriteRenderer (instancing pipeline = overkill cho 6-12 sprite, tăng maintenance, đi ngược kế hoạch legacy-removal-260503-1145)
- ❌ KHÔNG dùng `texture.offset/repeat` cho UV remapping (đây chính là cái lỗi)
- ❌ KHÔNG bump `texture.version` mỗi frame (re-upload canvas data → expensive, không scale)
- ✅ GIỮ kiến trúc 1-mesh-per-entity (đúng design intent "simple idle panel")
- ✅ MỖI entity có riêng material instance với riêng uniform UV rect

---

## Solution Overview

Thay `texture.offset/repeat` (UV qua texture.matrix uniform) bằng **uniform-driven UV remap trong shader**:

1. Tạo custom material module `idle-sprite-material.ts` (mirror pattern từ `sprite-material.ts` nhưng dùng `uniform()` thay `attribute()`):
   - **WebGPU**: TSL `MeshBasicNodeMaterial` với uniform `uUvRect: vec4`
   - **WebGL**: `ShaderMaterial` fallback với uniform `uUvRect`
2. Refactor `CombatIdleSprite` dùng material mới — set uniform value mỗi frame thay vì gọi `setAtlasFrame()`
3. Atlas vẫn xài CanvasTexture đã có (`buildAtlasFromTextures`) — chỉ thay đổi cách shader sample UV
4. Verify multi-instance animation + regression (death freeze, hit flash, attack transition, scale, foreshortening)

---

## Phases

| # | File | Status | Owner | Effort |
|---|---|---|---|---|
| 01 | [phase-01-uv-uniform-material.md](phase-01-uv-uniform-material.md) | ✅ Done 2026-05-09 | cook --auto | 2h |
| 02 | [phase-02-integrate-and-verify.md](phase-02-integrate-and-verify.md) | ✅ Done 2026-05-09 (manual test pass) | cook | 2-3h |
| 03 | [phase-03-cleanup-and-document.md](phase-03-cleanup-and-document.md) | ✅ Done 2026-05-09 | cook | 1h |

---

## Success Criteria

- [ ] 6+ slime entity chạy idle animation **độc lập, liên tiếp** (mỗi entity advance frame index riêng)
- [ ] Death animation play-through 1 lần rồi freeze frame cuối cho từng entity (không bị share state)
- [ ] Hit flash hoạt động per-entity (không trigger nhầm sprite khác)
- [ ] Attack/skill transition restart frame index từ 0 đúng cho từng entity
- [ ] Foreshortening per lane vẫn đúng (`getCombatSpriteScale(z, isBoss)`)
- [ ] WebGL fallback render đúng (test bằng cách disable WebGPU)
- [ ] Không regression với guild hall sprite-animator/woodcutting/working (vẫn dùng pattern cũ)
- [ ] Pre-existing test `tests/facility-production-parity.test.ts` không bị ảnh hưởng

---

## Files Affected

**Create**:
- `src/scene/combat/idle-sprite-material.ts` — NodeMaterial (WebGPU) + ShaderMaterial (WebGL) factory với uniform `uUvRect`

**Modify**:
- `src/scene/combat/combat-idle-sprite.tsx` — replace `<meshStandardMaterial>` với material mới; replace `setAtlasFrame()` calls bằng uniform updates
- `src/scene/sprites/sprite-atlas.ts` — thêm helper `getAtlasFrameUv(atlas, frameIndex): {u, v, w, h}` (extract UV calc từ setAtlasFrame để dùng chung)

**Untouched** (giữ nguyên — không trong scope):
- `src/scene/sprites/sprite-animator.tsx` (guild hall — 1-2 instance, chưa lộ bug)
- `src/scene/sprites/woodcutting-animator.tsx`, `working-animator.tsx` (idem)
- `src/scene/combat/instanced-sprite-renderer.tsx` + supporting infra (KEEP per D1)

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| TSL API không stable across Three.js versions | Med | Reuse pattern từ `sprite-material.ts` đã verified work; pin import path `three/tsl`, `three/webgpu` |
| WebGL ShaderMaterial không apply được lighting (mất shadow/ambient effect) | Low | Combat panel dùng `MeshBasicMaterial`-style trước đó (commit history) — pixel art không cần lighting; verify với designer nếu cần |
| Per-frame uniform update overhead | Very Low | Set 1 vec4 uniform per material per frame ≪ texture matrix update. 12 entity × 4 float = 48 float/frame |
| Death frozen state per entity | Low | Logic trong useFrame đã track `deathFrozenRef` per component — không cần đổi |
| Same bug ở woodcutting/working animator | Note | Document cho future; hiện tại chỉ 1-2 instance nên không lộ — defer |

---

## Verification Plan

### Manual test
1. Start dev server (`npm run dev`)
2. Mở combat panel với mission có 6+ enemy cùng spriteId (slime)
3. Quan sát: TẤT CẢ slime phải chạy idle animation liên tiếp
4. Trigger damage → flash + frame tiếp tục advance, không bị "nhảy"
5. Kill 1 slime → death anim play-through, freeze frame cuối, không ảnh hưởng slime khác
6. Test trên Chrome (WebGPU default) + Firefox (WebGL fallback nếu WebGPU off)

### Automated test (optional)
- Unit test `idle-sprite-material.ts` factory: returns expected material type per renderer
- Snapshot test UV rect calculation cho frame 0..N

---

## Out of Scope

- Fix tương tự cho sprite-animator/woodcutting/working (guild hall) — defer, chưa lộ bug
- Mount lại InstancedSpriteRenderer (đi ngược D1)
- Performance optimization beyond bug fix
- Refactor `setAtlasFrame` chung (chỉ extract `getAtlasFrameUv` helper)

---

## References

- [combat-idle-sprite.tsx](../../src/scene/combat/combat-idle-sprite.tsx) — current buggy implementation
- [sprite-material.ts](../../src/scene/combat/sprite-material.ts) — proven WebGPU TSL pattern (per-instance UV via attribute, ta sẽ chuyển sang uniform)
- [sprite-atlas.ts](../../src/scene/sprites/sprite-atlas.ts) — `setAtlasFrame` nguồn gốc bug (sẽ tách helper)
- [plan-260503-1123 D1](../260503-1123-combat-panel-idle-redesign/plan.md) — locked decision NOT use instancing
- [plan-260503-1145](../260503-1145-legacy-combat-path-removal/plan.md) — sẽ xóa instancing pipeline sau panel soak

---

## Open Questions

1. WebGL fallback có cần lighting (MeshStandard) hay basic (MeshBasic) là đủ? Hiện tại `combat-idle-sprite.tsx` đã từng là `MeshBasicMaterial` trước commit `86e00e4`, sau đó switch sang `MeshStandardMaterial` để fix bug WebGPU. Nếu uniform UV fix giải quyết được, có thể quay lại basic.
2. Có cần share material instance giữa các entity cùng `spriteId` không? — Không, mỗi entity cần riêng để uniform value khác nhau. (Material allocation 6-12 instances negligible.)
