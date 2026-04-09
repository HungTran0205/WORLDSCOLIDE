# 🔬 Review: three.quarks cho WORLDSCOLIDE

## Tổng quan thư viện

| Thông tin | Chi tiết |
|---|---|
| **Tên** | [three.quarks](https://github.com/Alchemist0823/three.quarks) |
| **Mô tả** | High-performance particle system / VFX engine cho Three.js |
| **Ngôn ngữ** | TypeScript (83.8%) |
| **License** | MIT ✅ |
| **Stars** | 777 ⭐ |
| **Forks** | 43 |
| **Commits** | 367 |
| **Bundle size** | ~1.2 MB (unpacked) |
| **Version** | 0.17.0 |
| **Packages** | Monorepo: `three.quarks`, `quarks.core`, `quarks.r3f`, `quarks.nodes` |

---

## Tech Stack Compatibility với WORLDSCOLIDE

### Project hiện tại đang dùng:

| Dependency | Version | Tương thích? |
|---|---|---|
| `three` | ^0.175.0 | ⚠️ Cần verify — three.quarks 0.17 có thể chưa test với 0.175 |
| `@react-three/fiber` | ^9.1.2 (R3F v9) | ⚠️ `quarks.r3f` cần check support cho R3F v9 |
| `react` | ^19.2.4 | ⚠️ React 19 — hệ sinh thái đang transition |
| `@react-three/postprocessing` | ^3.0.4 | ✅ Không conflict |
| `vite` | ^8.0.0 | ✅ Bundler compatible |
| WebGPU Renderer | Đang dùng (có check) | ❌ **three.quarks chưa hỗ trợ WebGPU** |

> [!WARNING]
> **WebGPU là vấn đề lớn nhất.** Project hiện tại có `webgpu-init.tsx` và `combat-post-processing.tsx` đã detect/skip WebGPU renderer. three.quarks hiện chỉ hỗ trợ WebGL — nằm trong roadmap nhưng **chưa implement**.

---

## Audit VFX hiện tại của project

Min đã xem qua các file VFX hiện có:

### 1. `torch-fire-particles.tsx` — Lửa đuốc
- **Kỹ thuật**: Custom sprite pool (~30 fire + 12 smoke sprites)
- **Rendering**: `THREE.Sprite` + `AdditiveBlending`
- **Simulation**: CPU-based, `useFrame` manually
- **Tuning**: `leva` controls real-time
- **Đánh giá**: Code khá clean nhưng **mỗi sprite = 1 draw call** 💀

### 2. `combat-hit-spark.tsx` — Spark khi đánh
- **Kỹ thuật**: Single Billboard sprite, canvas-generated texture
- **Lifetime**: 150ms, scale+fade animation
- **Đánh giá**: Lightweight nhưng thiếu particle burst, chưa "cháy" lắm

### 3. `combat-vfx-layer.tsx` — VFX coordinator
- **Kỹ thuật**: React state-driven spawn/despawn
- **Issue**: Mỗi effect = 1 React component mount/unmount → **GC pressure**

### 4. `combat-post-processing.tsx` — Post-processing
- Chỉ có Vignette, skip khi WebGPU
- **Chưa có**: Bloom, motion blur, screen distortion

> [!NOTE]
> **Tổng kết**: Project đang dùng approach rất thủ công — mỗi effect viết riêng, không có batch rendering, không có shared particle pool. Scale thêm effects sẽ ngày càng đau.

---

## three.quarks có gì hay? 🎯

### ✅ Pros

| Feature | Giá trị cho WORLDSCOLIDE |
|---|---|
| **Batched Renderer** | Gom nhiều particle systems → ít draw calls, FPS ổn hơn rất nhiều |
| **Behavior System** | Color/Size/Rotation over lifetime, force fields, orbital motion — đỡ phải code tay |
| **Emitter Shapes** | Point, Cone, Sphere, Mesh Surface, Grid — đa dạng |
| **Trail Renderer** | Ribbon trails cho kiếm chém, skill bay — rất cần cho combat |
| **Sub-emitters** | Particle spawn particle — explosion → sparks → smoke chain |
| **Texture Atlas** | Sprite sheet animation built-in |
| **Visual Editor** | [quarks.art/create](https://quarks.art/create) — designer-friendly |
| **JSON Export/Import** | Design → export → load runtime → iterate nhanh |
| **Unity Shuriken Compatible** | Nếu có asset Unity → convert được |
| **R3F Integration** | `quarks.r3f` package — declarative JSX components |
| **Plugin System** | Extend custom behaviors |
| **MIT License** | Free xài, free modify |

### ❌ Cons / Risks

| Vấn đề | Mức độ |
|---|---|
| **Chưa hỗ trợ WebGPU** | 🔴 **Critical** — project đang target WebGPU |
| **React 19 + R3F v9 chưa verified** | 🟡 **High** — có thể cần patch |
| **three.js 0.175 compatibility chưa rõ** | 🟡 **Medium** — phiên bản quá mới |
| **1 dev chính** (Alchemist0823) | 🟡 **Medium** — bus factor = 1 |
| **Bundle size ~1.2MB** | 🟡 **Medium** — hơi nặng cho web game |
| **Editor export cần paid plan ($12/mo)** | 🟡 **Medium** — free tier giới hạn |
| **8 open issues, hoạt động vừa phải** | 🟡 **Medium** |
| **Chưa có WASM simulation** (roadmap) | 🔵 **Low** — tương lai mới cần |

---

## Pricing Analysis 💰

| Plan | Giá | Đáng ko? |
|---|---|---|
| **Free** | $0 | Engine integration ✅, Editor ✅, **KHÔNG export JSON** ❌ |
| **Starter** | $12/mo | Export JSON ✅, Discord support, 1-3 người |
| **Pro** | $36/mo | Collaborators, unlimited Unity import |
| **Enterprise** | Custom | Consultation, dedicated resources |

> [!IMPORTANT]
> **Runtime engine (npm package) hoàn toàn FREE** — MIT license. Chỉ **editor cloud** mới tính phí. Có thể dùng engine mà không cần editor, tự code effects bằng API.

---

## 3 Chiến lược đề xuất 🎮

### Approach 1: Direct Integration (Xài trực tiếp)

```
Effort: ⭐⭐ (Low-Medium)
Risk:   ⭐⭐⭐⭐ (High — WebGPU incompatible)
Payoff: ⭐⭐⭐ (Medium)
```

- `npm install three.quarks quarks.r3f`
- Migrate từng effect sang quarks API
- **Blocker**: WebGPU support chưa có → phải fallback WebGL cho particle rendering

### Approach 2: Build Custom VFX Library (Tự build)

```
Effort: ⭐⭐⭐⭐⭐ (Very High)
Risk:   ⭐⭐ (Low — full control)
Payoff: ⭐⭐⭐⭐⭐ (Maximum — tailored cho game)
```

- Build custom particle engine dùng `InstancedMesh` / GPU compute
- WebGPU-first design
- Lấy ý tưởng architecture từ three.quarks (batch rendering, behavior system)
- **Tốn thời gian** nhưng sẽ tối ưu nhất cho project

### Approach 3: 🏆 Hybrid (Recommended)

```
Effort: ⭐⭐⭐ (Medium)
Risk:   ⭐⭐ (Low-Medium)
Payoff: ⭐⭐⭐⭐ (High)
```

**Phase 1 — Immediate**: Dùng three.quarks cho **non-WebGPU** particles
- Fire, smoke, ambient dust, skill effects
- BatchedRenderer minimize draw calls ngay
- Học từ API design + behavior system của họ

**Phase 2 — Medium term**: Build custom `WorldVFX` wrapper
- Abstract layer wrap three.quarks + custom GPU particles
- Detect WebGPU → dùng custom compute shader particles
- Detect WebGL → fallback three.quarks batched renderer

**Phase 3 — Long term**: Full custom engine (khi nhu cầu phức tạp)
- Migrate đẹp nhờ abstraction layer ở Phase 2
- Implement những gì three.quarks thiếu: WebGPU compute, custom shaders cho HD-2D aesthetic

---

## So sánh cụ thể: Hiện tại vs three.quarks

| Aspect | Hiện tại (Custom) | Với three.quarks |
|---|---|---|
| **Torch Fire** | 30 sprites × 1 draw call = 30 calls | 1 batched draw call |
| **Hit Spark** | 1 Billboard mount/unmount | Pooled, auto-recycled |
| **10 torches + 5 combat effects** | ~45-60 draw calls | ~2-3 draw calls |
| **Add new effect** | Viết ~100 LOC mới | Config JSON hoặc ~10 LOC |
| **Designer iteration** | Dev phải code mỗi tweak | Visual editor → instant |
| **Memory** | GC spikes từ React reconciler | Pooled, pre-allocated |

---

## Verdict 🎯

> **three.quarks rất phù hợp cho giai đoạn hiện tại** nhưng cần **chiến lược hybrid** vì WebGPU incompatibility.
>
> Cái game "cháy hơn" mà H muốn — với trail effects, explosion chains, skill VFX đẹp — **nhất định cần một particle engine**, không thể cứ viết tay từng effect.
>
> Min recommend **Approach 3 (Hybrid)**: dùng three.quarks làm foundation, wrap lại với abstraction layer, rồi dần build custom WebGPU particles khi cần.

---

## Open Questions cho H 🤔

1. **WebGPU priority**: Game hiện tại có bắt buộc chạy WebGPU không, hay WebGL vẫn OK cho particle layer?
2. **Visual Editor**: H có muốn dùng quarks.art editor ($12/mo) hay chấp nhận code effects bằng API?
3. **Scope VFX**: Ngoài fire/spark, H cần những effects gì? (trail kiếm, explosion, heal glow, buff aura, skill projectiles...?)
4. **Performance target**: Bao nhiêu concurrent particle systems là acceptable? (10? 50? 100?)
