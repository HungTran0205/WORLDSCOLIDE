# VFX Particles Integration Guide

> **Why this doc exists**: hard-won lessons từ playground integration. Đọc trước khi build combat VFX.

## Stack

- **`r3f-vfx@0.6.0`** — React Three Fiber wrapper
- **`core-vfx@0.5.0`** — engine (WebGPU compute particles)
- **Renderer**: `WebGPURenderer` only (CPU fallback có nhưng pattern khác)
- **Source**: https://github.com/mustache-dev/Three-VFX
- **Reference example**: https://github.com/mustache-dev/caps-wars

## Pattern bắt buộc: Persistent VFXParticles + Named Emitters

Lib **chỉ được test với pattern này**. Mount/unmount động → crash WebGPU device.

### Cấu trúc

```tsx
// 1. Định nghĩa hằng số tên particle systems
export const COMBAT_PARTICLES = {
  SLASH_LIGHT: 'slash-light',
  SLASH_HEAVY: 'slash-heavy',
  IMPACT_BLOOD: 'impact-blood',
  IMPACT_SPARK: 'impact-spark',
  HIT_FLASH: 'hit-flash',
  DEATH_PUFF: 'death-puff',
  GUARD_BREAK: 'guard-break',
  PARRY: 'parry',
} as const

export type CombatParticleType = (typeof COMBAT_PARTICLES)[keyof typeof COMBAT_PARTICLES]

// 2. Mount TẤT CẢ VFXParticles MỘT LẦN ở root combat scene, KHÔNG bao giờ unmount
export const CombatParticles = () => (
  <>
    <VFXParticles name={COMBAT_PARTICLES.SLASH_LIGHT} maxParticles={200} {...slashLightProps} />
    <VFXParticles name={COMBAT_PARTICLES.SLASH_HEAVY} maxParticles={400} {...slashHeavyProps} />
    <VFXParticles name={COMBAT_PARTICLES.IMPACT_BLOOD} maxParticles={300} {...bloodProps} />
    {/* ...all others */}
  </>
)

// 3. Trigger emission từ bất kỳ đâu qua hook
const SwordHitbox = () => {
  const { emit } = useVFXEmitter(COMBAT_PARTICLES.SLASH_LIGHT)
  
  const onHit = (pos: [number, number, number]) => {
    emit(pos, 50, { direction: [[1,1],[0,0],[0,0]] }) // overrides per emission
  }
}
```

### Lý do tại sao bắt buộc

1. **Compute pipeline** + storage buffers tạo ở mount, dispose có race với pending GPU submissions
2. Lib's `dispose()` không await `device.queue.onSubmittedWorkDone()` → buffer destroyed khi GPU vẫn đang dùng
3. Đã thử patch lib's dispose → vẫn race; persistent pattern là cách duy nhất an toàn (verified với caps-wars)

## Anti-patterns

### ❌ KHÔNG: dynamic mount/unmount VFXParticles

```tsx
// SAI — sẽ crash WebGPU device khi switch:
{currentEffect && <VFXParticles key={currentEffect.id} {...currentEffect.props} />}
```

Cả production combat và **dev playground** đều dùng persistent pattern (refactored 2026-05-02 — xem `plans/260502-1838-vfx-persistent-pattern-refactor/`). Trước đây playground dùng anti-pattern + lib patch; cả hai đã loại bỏ.

### ❌ KHÔNG: pass params động vào VFXParticles props

`maxParticles`, `geometry`, `lifetime`, etc. được bake vào compute pipeline lúc mount. Đổi runtime → cần re-mount → crash. **Tweak qua `overrides` ở `emit()` thay vì props**:

```tsx
// SAI:
<VFXParticles maxParticles={enemyCount * 50} ... />

// ĐÚNG: declare đủ lớn từ đầu, override per-emission
<VFXParticles maxParticles={500} ... />
emit(pos, count, { speed: [2,5], colorStart: ['#ff0000'] })
```

### ❌ KHÔNG: tạo nhiều `<CombatParticles />` instance

Phải mount **đúng một** instance ở root scene. Lib dùng global Zustand store theo `name`, mount nhiều instance cùng `name` sẽ conflict.

## Combat Scene Architecture

```
<Canvas>
  <CombatParticles />         ← persistent, root level
  <CombatScene>
    <Player>
      <SwordHitbox />          ← gọi useVFXEmitter('slash-light')
    </Player>
    <Enemies>
      <Enemy />               ← useVFXEmitter('impact-blood') khi bị hit
    </Enemies>
  </CombatScene>
</Canvas>
```

**Rule**: VFXParticles definitions sống ở `CombatParticles`. VFXEmitter (hoặc `useVFXEmitter` hook) sống ở entity gây ra hiệu ứng. Tách config khỏi trigger.

## Runtime Override API (per-emission tuning)

`emit(pos, count, overrides)` chấp nhận **bất kỳ `BaseParticleProps`** field:

```tsx
emit([x, y, z], 100, {
  direction: [[1,1],[0,0],[0,0]],   // attack direction
  colorStart: ['#ff0000'],           // crit = red
  speed: [3, 8],
  size: [0.2, 0.5],
  gravity: [0, -20, 0],
  lifetime: [0.3, 0.8],
})
```

Cho phép reuse 1 system cho nhiều biến thể (left-slash / right-slash / crit-slash) **zero extra draw calls**.

## Persistent pattern enforced (no patch needed)

Trước đây có `patches/core-vfx+0.5.0.patch` async-ify dispose. **Không còn cần** — refactor playground 2026-05-02 chuyển sang persistent pattern → không có dispose mid-frame → race không xảy ra. Patch + `patch-package` dep + `postinstall` hook đã xóa.

Khi bump `r3f-vfx`/`core-vfx`: chỉ cần verify `STRUCTURAL_KEYS` export còn ổn (`tools/vfx-playground/src/presets/preset-prop-classification.ts` import từ docs reference, hard-code ngay tại file đó).

## Checklist cho combat VFX mới

- [ ] Add `name` constant vào `COMBAT_PARTICLES`
- [ ] Add `<VFXParticles name=... />` vào `CombatParticles` component (root)
- [ ] Set `maxParticles` đủ lớn cho worst case (gấp 2-3 lần expected)
- [ ] Khai báo `geometry`, `lifetime`, `speed` defaults; tinh chỉnh per-event qua `overrides`
- [ ] Trigger qua `useVFXEmitter(name)` ở entity tương ứng
- [ ] Test: spawn liên tục, không reload page → đảm bảo không có buffer leak warning trong console
- [ ] **Không** `key` prop dynamic, **không** unmount

## Hiệu năng tip

- Mỗi `<VFXParticles>` = 1 compute pipeline + storage buffers. ~10-15 systems là OK trên mid-tier GPU.
- `maxParticles=500` ≈ 30KB storage per system. 15 systems × 500 ≈ 450KB tổng — không đáng kể.
- `emit()` rẻ; spawn 1000 particles cùng frame OK.
- **Đắt**: `geometry` phức tạp (>1k tris) × `maxParticles` cao. Giữ geometry đơn giản (plane/box/sphere LOW poly).

## Liên quan

- Bug investigation: `plans/reports/researcher-260502-1815-webgpu-buffer-cleanup-investigation.md`
- Playground (đã refactor sang persistent pattern): `tools/vfx-playground/`
- Refactor plan: `plans/260502-1838-vfx-persistent-pattern-refactor/plan.md`
