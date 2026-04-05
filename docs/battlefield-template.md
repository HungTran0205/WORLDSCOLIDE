# Battlefield (Sa Bàn) — Sizing Template & Generation Standard

> **Chuẩn này áp dụng cho tất cả map mới.** Dùng làm reference khi generate assets (background, props, ground texture).

---

## 1. Camera Spec (cố định — không đổi)

| Property | Value | Note |
|---|---|---|
| Projection | Orthographic | HD-2D pixel-art style |
| Zoom | `114` | 1 world unit ≈ 114px tại viewport 16:9 full HD |
| Position | `[0, 3.6, 10.0]` | X-center, Y lifted 3.6u, Z=10 |
| View angle | ~20° downward tilt | Do Y=3.6 kết hợp Z=10 — tạo góc nhìn từ trên xuống nhẹ |
| Near / Far clip | `0.1` / `1000` | — |
| DPR | `1` | Pixel art — không scale up |

**Viewport visible range tại zoom=114:**
- Tại 1920×1080: width ≈ 16.8 units, height ≈ 9.5 units
- Tại 1280×720: width ≈ 11.2 units, height ≈ 6.3 units
- **Design safe zone: ±8 X, ±4.5 Y** (tính từ origin [0,0,0])

---

## 2. Arena World Dimensions

```
        ◄────────────── 22 units total ──────────────►
        │                                             │
X:    -11                    0                      +11
        │                                             │
        ├── Ally zone ──┤── Clash ──┤── Enemy zone ──┤
             6 units       center      6 units
          center x=-5      x=0       center x=+5
```

| Zone | X range | Color hint |
|---|---|---|
| Ally side (Player) | `-8` → `-2` | Blue tint `#3366aa` opacity 8% |
| Clash center line | `x=0`, width=0.04 | White `#ffffff` opacity 10% |
| Enemy side | `+2` → `+8` | Red tint `#aa3333` opacity 8% |
| Full ground plane | `-11` → `+11` | 22 × 9 units |

**Ground Y:** `y = 0` (ground plane rotated -90° = horizontal floor)  
**Character spawn Y:** `y = 0` (feet at ground level)

---

## 3. Layer System (Simplified — sau khi bỏ mid/near)

```
Z depth (far → near):

  [FAR BG]       z = -7 to -13    ← sky / distant scenery (2D PNG billboard)
  [3D GROUND]    y = 0            ← diorama GLB hoặc tiled texture
  [3D PROPS]     z = -6 to +5     ← trees, rocks, pillars (GLB)
  [CHARACTERS]   z ≈ 0 to +3      ← entity sprites
  [VFX]          z = +3 to +5     ← particles, damage numbers
  [POST-PROCESS]                  ← vignette, bloom (screen-space)
```

> **Mid/Near PNG layers đã bị loại bỏ.** Depth layering giờ hoàn toàn qua 3D props GLB.

---

## 4. Far Background Layer Spec

### 4.1 World-space values

| Property | Forest default | Cave default | Range cho map mới |
|---|---|---|---|
| `z` | `-6.9` | `-12.9` | `-6` to `-14` |
| `y` | `3.7` | `4.0` | `3.5` to `4.5` |
| `scale` | `1.10` | `1.20` | `1.0` to `1.5` |
| `opacity` | `0.18` | `0.90` | `0.1` to `1.0` |

**Công thức kích thước render trên màn hình:**
```
rendered_width  = scale × image_aspect × 10  (world units)
rendered_height = scale × 10                 (world units)
```

Để phủ toàn bộ viewport width 16.8u tại scale=1.1:
```
required_aspect = 16.8 / (1.1 × 10) = 1.527
→ Tối thiểu aspect ratio 3:2 (=1.5) ở scale=1.1
→ Khuyến nghị: 2:1 (width:height) → rendered_width = scale × 2 × 10
   - scale 1.1 → 22u wide (phủ toàn bộ 22u ground plane)
```

### 4.2 Canvas size khuyến nghị

| Use case | Resolution | Aspect | File size target |
|---|---|---|---|
| **Standard** (mặc định) | `2048 × 1024` | 2:1 | < 500 KB PNG |
| High detail / showcase | `4096 × 2048` | 2:1 | < 1.5 MB PNG |
| Lightweight / mobile first | `1024 × 512` | 2:1 | < 150 KB PNG |

- **Format:** PNG-24 với alpha channel (transparent sky nếu fog là solid color)
- Hoặc PNG-24 không alpha nếu background fill cả frame
- **Không dùng JPEG** — pixel art cần hard edges, JPEG tạo artifacts

### 4.3 Content zones trong far background image

```
┌────────────────────────────────────────────────────────────────────┐ 1024px top
│                                                                    │
│  ══ SKY ZONE ═════════════════════════════════════════════════════ │ ~600px
│    Mountains / clouds / stars / cave ceiling — key visual content  │
│                                                                    │
│  ══ HORIZON TRANSITION ══════════════════════════════════════════  │ ~200px
│    Fade gradient from sky to mist / fog                            │
│                                                                    │
│  ══ GROUND FADE ════════════════════════════════════════════════   │ ~224px bottom
│    Should fade to transparent OR match groundColor / fogColor      │
└────────────────────────────────────────────────────────────────────┘
        ← left edge                                right edge →
                         2048px wide
```

**Y offset rule:** `y = 3.7` đặt center của billboard tại cao độ 3.7u ≈ giữa viewport.  
Điều chỉnh `y` lên/xuống để shift đường chân trời lên/xuống.

---

## 5. BgLayer config snippet (copy-paste cho map mới)

```typescript
bgLayers: [
  {
    src: '/arena/YOUR_BIOME/bg/far.png',
    z: -8,          // khoảng cách Z — âm càng nhiều càng xa
    y: 3.7,         // vertical center — match camera Y=3.6
    scale: 1.1,     // 1.1 để rendered_width = 22u (2:1 image)
    opacity: 1.0,   // 1.0 nếu là solid sky; 0.1-0.3 nếu có 3D diorama phía trước
  },
],
```

---

## 6. Naming Convention (file paths)

```
public/arena/
└── {biome_id}/
    ├── bg/
    │   └── far.png                ← 2048×1024, far background only
    ├── 3dtiles/
    │   └── optimized/
    │       └── {biome_id}ground.glb    ← ground diorama
    └── 3dprops/
        └── optimized/
            └── p_{prop_name}.glb      ← individual props (p_ prefix)
```

`{biome_id}` examples: `forest`, `cave`, `plains`, `temple`, `volcano`

---

## 7. Checklist — New Map

- [ ] far.png: 2048×1024, PNG, 2:1 aspect ratio
- [ ] far.png bottom ~25% fades to `fogColor` or transparent
- [ ] `bgLayers` contains **only 1 entry** (far only — no mid/near)
- [ ] `z` value: chọn trong range `-6` to `-14`
- [ ] `y`: bắt đầu với `3.7`, tweak ±1 tùy content
- [ ] `scale`: `1.1` cho 2:1 image → covers full 22u width
- [ ] `opacity`: `1.0` cho cave/indoor; `0.15–0.3` cho outdoor với diorama
- [ ] Ground: GLB diorama (`diorama` + `dioramaScale`) hoặc tiled texture (`groundTexture`)
- [ ] `fogColor`: matching dark tone của biome (hex)
- [ ] `BiomeConfig` registered vào `ZONE_TO_BIOME` map

---

## 8. Biome Color Reference

| Biome type | `fogColor` | `groundColor` | Far BG tone | Ambient color |
|---|---|---|---|---|
| Forest outdoor | `#1a2e1a` | `#3a5a2a` | Green canopy / sky | `#c8e6c8` |
| Cave underground | `#0a0a14` | `#2a2a30` | Dark rock ceiling | `#8080c0` |
| Plains / savanna | `#2a1e0a` | `#7a5a2a` | Warm sky / dust | `#ffe0a0` |
| Temple / ruins | `#1a1410` | `#4a3a28` | Stone wall / dusk | `#d0b080` |
| Snow / tundra | `#0a0a20` | `#d0d8e8` | Blizzard sky | `#a0c0e0` |
| Volcanic | `#1a0a00` | `#3a1a00` | Lava-lit cave | `#ff6020` |
