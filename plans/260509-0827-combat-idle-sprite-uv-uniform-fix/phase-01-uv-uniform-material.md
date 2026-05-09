# Phase 01 — UV Uniform Material Module

**Status**: ✅ Done — 2026-05-09
**Effort**: ~2h
**Depends on**: none

---

## Goal

Tạo factory `idle-sprite-material.ts` build material per-entity với UV remapping qua **uniform vec4 `uUvRect`** thay vì `texture.matrix`. Hỗ trợ cả WebGPU (TSL NodeMaterial) và WebGL (ShaderMaterial).

## Context Links

- [sprite-material.ts](../../src/scene/combat/sprite-material.ts) — pattern source (dùng `attribute()` cho instancing, ta đổi sang `uniform()`)
- [sprite-atlas.ts](../../src/scene/sprites/sprite-atlas.ts) — atlas builder, vẫn reuse `buildAtlasFromTextures`
- [webgpu-init.tsx](../../src/scene/webgpu-init.tsx) — renderer detection (`'isWebGLRenderer' in renderer`)

## Key Design

### UV remap formula (giống sprite-material.ts)
```
atlasUv = vec2(
  uUvRect.x + baseUv.x * uUvRect.z,   // u_offset + u * u_width
  uUvRect.y + baseUv.y * uUvRect.w    // v_offset + v * v_height
)
```

`uUvRect = (u, v, w, h)` — sub-rectangle trong atlas tương ứng frame hiện tại.

### Helper trong sprite-atlas.ts
Extract UV calculation từ `setAtlasFrame` thành helper share-able:
```ts
export function getAtlasFrameUv(atlas: SpriteAtlas, frameIndex: number): { u: number; v: number; w: number; h: number } {
  const col = frameIndex % atlas.cols;
  const row = Math.floor(frameIndex / atlas.cols);
  return {
    u: col / atlas.cols,
    v: 1 - (row + 1) / atlas.rows,   // flip Y giống setAtlasFrame
    w: 1 / atlas.cols,
    h: 1 / atlas.rows,
  };
}
```
`setAtlasFrame` giữ nguyên (cho sprite-animator/woodcutting/working dùng) — chỉ thêm helper mới.

## Implementation

### File: `src/scene/combat/idle-sprite-material.ts` (NEW)

```ts
/**
 * IdleSpriteMaterial — per-entity material for combat panel idle sprites.
 *
 * Bypasses WebGPU NodeMaterial texture.matrix dedupe bug (multi-instance same
 * pipeline → only 1 material's UV uniform refreshes per frame). Each entity
 * mounts its own material with a uniform `uUvRect: vec4` driving UV remap in
 * the shader directly. Atlas texture is shared via map binding; only the UV
 * uniform differs per entity.
 *
 * WebGPU: TSL MeshBasicNodeMaterial — uniform() node + uv() attribute.
 * WebGL:  ShaderMaterial — same logic in GLSL.
 *
 * Background: see plans/260509-0827-combat-idle-sprite-uv-uniform-fix/plan.md
 */

import * as THREE from 'three';

export interface IdleSpriteMaterialHandle {
  material: THREE.Material;
  /** Update the UV rect uniform — called per useFrame tick */
  setUvRect: (u: number, v: number, w: number, h: number) => void;
  /** Update tint color (white flash on hit, grey when dead) */
  setTint: (r: number, g: number, b: number) => void;
  /** Swap atlas texture (e.g. idle → death animation) */
  setMap: (texture: THREE.Texture) => void;
  /** Dispose underlying material + uniforms */
  dispose: () => void;
}

// ─── WebGPU path (TSL NodeMaterial) ──────────────────────────────────────────

let _nodeFactory: ((atlas: THREE.Texture) => Promise<IdleSpriteMaterialHandle>) | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { texture: textureFn, uv, uniform, vec2, mix, max: tslMax, float: tslFloat, vec3, vec4 } =
    await import('three/tsl');

  _nodeFactory = async (atlasTexture: THREE.Texture) => {
    const material = new MeshBasicNodeMaterial();
    material.transparent = true;
    material.alphaTest = 0.1;
    material.side = THREE.DoubleSide;

    // Per-material uniforms (NOT shared across instances)
    const uvRectUniform = uniform(vec4(0, 0, 1, 1));
    const tintUniform = uniform(vec3(1, 1, 1));
    const mapUniform = uniform(atlasTexture);

    // UV remap: baseUv [0,1] → atlas sub-rect
    const baseUv = uv();
    const atlasUv = vec2(
      uvRectUniform.x.add(baseUv.x.mul(uvRectUniform.z)),
      uvRectUniform.y.add(baseUv.y.mul(uvRectUniform.w)),
    );

    const texColor = textureFn(mapUniform, atlasUv);

    // Tint multiply (white = no change, grey = dim, hi-RGB = flash)
    material.colorNode = texColor.xyz.mul(tintUniform);
    material.opacityNode = texColor.w;

    return {
      material,
      setUvRect: (u, v, w, h) => uvRectUniform.value.set(u, v, w, h),
      setTint: (r, g, b) => tintUniform.value.set(r, g, b),
      setMap: (tex) => { mapUniform.value = tex; },
      dispose: () => material.dispose(),
    };
  };

  return _nodeFactory;
}

// ─── WebGL path (ShaderMaterial) ─────────────────────────────────────────────

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec4 uUvRect;
  uniform vec3 uTint;

  varying vec2 vUv;

  void main() {
    vec2 atlasUv = vec2(uUvRect.x + vUv.x * uUvRect.z, uUvRect.y + vUv.y * uUvRect.w);
    vec4 texColor = texture2D(uMap, atlasUv);
    if (texColor.a < 0.1) discard;
    gl_FragColor = vec4(texColor.rgb * uTint, texColor.a);
  }
`;

function createShaderHandle(atlasTexture: THREE.Texture): IdleSpriteMaterialHandle {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: atlasTexture },
      uUvRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uTint: { value: new THREE.Vector3(1, 1, 1) },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });

  return {
    material,
    setUvRect: (u, v, w, h) => (material.uniforms.uUvRect.value as THREE.Vector4).set(u, v, w, h),
    setTint: (r, g, b) => (material.uniforms.uTint.value as THREE.Vector3).set(r, g, b),
    setMap: (tex) => { material.uniforms.uMap.value = tex; },
    dispose: () => material.dispose(),
  };
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Create a per-entity idle sprite material handle.
 * Auto-detects renderer type. WebGPU returns Promise; WebGL is sync but wrapped
 * in Promise for uniform call signature.
 */
export async function createIdleSpriteMaterial(
  atlasTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer | unknown,
): Promise<IdleSpriteMaterialHandle> {
  const isWebGPU = renderer && !(renderer as { isWebGLRenderer?: boolean }).isWebGLRenderer;
  if (isWebGPU) {
    const factory = await getNodeFactory();
    return factory(atlasTexture);
  }
  return createShaderHandle(atlasTexture);
}
```

### File: `src/scene/sprites/sprite-atlas.ts` (MODIFY — add helper)

Thêm export sau `setAtlasFrame`:
```ts
/** Pure UV calculation — sharable between texture-matrix path and uniform path */
export function getAtlasFrameUv(atlas: SpriteAtlas, frameIndex: number) {
  const col = frameIndex % atlas.cols;
  const row = Math.floor(frameIndex / atlas.cols);
  return {
    u: col / atlas.cols,
    v: 1 - (row + 1) / atlas.rows,
    w: 1 / atlas.cols,
    h: 1 / atlas.rows,
  };
}
```

KHÔNG xóa/đổi `setAtlasFrame` — animator khác (sprite/woodcutting/working) còn dùng.

## Todo

- [x] Create `src/scene/combat/idle-sprite-material.ts` với 2 path WebGPU/WebGL
- [x] Add `getAtlasFrameUv` export to `src/scene/sprites/sprite-atlas.ts`
- [x] TypeScript compile check (`npx tsc --noEmit`) — không error (exit 0)
- [x] Verify TSL imports đúng (`three/tsl`, `three/webgpu`) bằng cách so với `sprite-material.ts`
- [x] Code review (DONE_WITH_CONCERNS → fixes applied: CRITICAL #1 textureFn vs uniform, HIGH #1 depthWrite parity, MEDIUM #1 renderer detection consistency)

## Success Criteria

- [ ] Module export `createIdleSpriteMaterial` async factory
- [ ] Handle interface có 4 method: `setUvRect`, `setTint`, `setMap`, `dispose`
- [ ] WebGPU path dùng `uniform()` (NOT `attribute()`) — quan trọng để mỗi material có giá trị riêng
- [ ] WebGL path có vec4 `uUvRect`, vec3 `uTint`, sampler2D `uMap`
- [ ] No regression khi compile codebase

## Risks

| Risk | Mitigation |
|---|---|
| TSL `uniform(vec4(...))` syntax không match expectation | Verify với existing `sprite-material.ts` patterns; test factory standalone trước khi integrate |
| `MeshBasicNodeMaterial.colorNode` overwrite map binding | Set `material.colorNode = texColor.xyz.mul(tintUniform)` đúng order; opacityNode = alpha channel separately |
| Renderer detection sai (R3F gl object) | Pattern `'isWebGLRenderer' in renderer` đã dùng trong sprite-material.ts — copy y nguyên |

## Next Phase

→ [phase-02-integrate-and-verify.md](phase-02-integrate-and-verify.md) — wire material vào CombatIdleSprite
