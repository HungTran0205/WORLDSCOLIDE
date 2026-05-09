/**
 * IdleSpriteMaterial — per-entity material factory for combat panel sprites.
 *
 * Bypasses WebGPU NodeMaterial texture.matrix dedupe behavior (multiple
 * material instances sharing pipeline cache → only 1 material's UV uniform
 * refreshes per frame, others freeze on whatever frame the binding cached).
 *
 * Each entity mounts its own material with private uniform `uUvRect: vec4`
 * driving UV remap directly in the shader. Atlas texture is shared via map
 * binding; only the UV uniform differs per entity, so animation advances
 * independently for every sprite.
 *
 * WebGPU: TSL MeshBasicNodeMaterial — uniform() node + uv() input.
 * WebGL:  ShaderMaterial fallback — same logic in GLSL.
 *
 * Background: plans/260509-0827-combat-idle-sprite-uv-uniform-fix/plan.md
 */

import * as THREE from 'three';

export interface IdleSpriteMaterialHandle {
  material: THREE.Material;
  /** Update the UV rect uniform — called per useFrame tick */
  setUvRect: (u: number, v: number, w: number, h: number) => void;
  /** Update tint color (white = normal, hi-RGB = flash, low = dim/dead) */
  setTint: (r: number, g: number, b: number) => void;
  /** Swap atlas texture (idle ↔ attack ↔ death) */
  setMap: (texture: THREE.Texture) => void;
  /** Dispose underlying material and uniforms */
  dispose: () => void;
}

// ─── WebGPU path (TSL NodeMaterial) ──────────────────────────────────────────

let _nodeFactory:
  | ((atlas: THREE.Texture) => IdleSpriteMaterialHandle)
  | null = null;

async function getNodeFactory(): Promise<
  (atlas: THREE.Texture) => IdleSpriteMaterialHandle
> {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  // textureFn returns a TextureNode (NOT a plain UniformNode) — required for
  // proper WebGPU texture binding. uniform() is for non-texture values only.
  const { texture: textureFn, uv, uniform, vec2 } = await import('three/tsl');

  _nodeFactory = (atlasTexture: THREE.Texture) => {
    const material = new MeshBasicNodeMaterial();
    material.transparent = true;
    material.alphaTest = 0.1;
    material.side = THREE.DoubleSide;
    // Match WebGL fallback (line 129) and reference sprite-material.ts pattern
    // — depthWrite=true keeps front-row sprites in front of back-row regardless
    // of mount order; transparent materials default to depthWrite=false which
    // breaks lane ordering when slimes overlap z-coords.
    material.depthWrite = true;

    // Per-material uniforms — NOT shared across material instances. Each call
    // to this factory builds a new material with its own uniform/texture nodes,
    // so updating one entity's uvRect doesn't leak into another entity's UV.
    const uvRectUniform = uniform(new THREE.Vector4(0, 0, 1, 1));
    const tintUniform = uniform(new THREE.Vector3(1, 1, 1));

    // UV remap: baseUv [0,1] → atlas sub-rect (u, v, w, h)
    const baseUv = uv();
    const atlasUv = vec2(
      uvRectUniform.x.add(baseUv.x.mul(uvRectUniform.z)),
      uvRectUniform.y.add(baseUv.y.mul(uvRectUniform.w)),
    );

    // Sample the atlas at the remapped UV. textureFn(tex, uv) returns a
    // TextureNode (subclass of UniformNode) — mutate `.value` to swap atlas
    // (idle ↔ attack ↔ death) without rebuilding the material.
    const mapNode = textureFn(atlasTexture, atlasUv);

    // Tint multiply: (1,1,1) = pass-through; (>1,>1,>1) = flash; (<1,<1,<1) = dim
    material.colorNode = mapNode.xyz.mul(tintUniform);
    material.opacityNode = mapNode.w;

    return {
      material,
      setUvRect: (u, v, w, h) =>
        (uvRectUniform.value as THREE.Vector4).set(u, v, w, h),
      setTint: (r, g, b) =>
        (tintUniform.value as THREE.Vector3).set(r, g, b),
      setMap: (tex) => {
        // TextureNode.value setter handles GPU rebind on next render.
        mapNode.value = tex;
      },
      dispose: () => material.dispose(),
    };
  };

  return _nodeFactory;
}

// ─── WebGL path (ShaderMaterial) ─────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec4 uUvRect;
  uniform vec3 uTint;

  varying vec2 vUv;

  void main() {
    vec2 atlasUv = vec2(
      uUvRect.x + vUv.x * uUvRect.z,
      uUvRect.y + vUv.y * uUvRect.w
    );
    vec4 texColor = texture2D(uMap, atlasUv);
    if (texColor.a < 0.1) discard;
    gl_FragColor = vec4(texColor.rgb * uTint, texColor.a);
  }
`;

function createShaderHandle(
  atlasTexture: THREE.Texture,
): IdleSpriteMaterialHandle {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: atlasTexture },
      uUvRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uTint: { value: new THREE.Vector3(1, 1, 1) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });

  return {
    material,
    setUvRect: (u, v, w, h) =>
      (material.uniforms.uUvRect.value as THREE.Vector4).set(u, v, w, h),
    setTint: (r, g, b) =>
      (material.uniforms.uTint.value as THREE.Vector3).set(r, g, b),
    setMap: (tex) => {
      material.uniforms.uMap.value = tex;
    },
    dispose: () => material.dispose(),
  };
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Create a per-entity idle sprite material handle.
 * Auto-detects renderer type: WebGPU (TSL NodeMaterial) or WebGL (ShaderMaterial).
 *
 * Returns Promise — WebGPU path requires async import of three/webgpu + three/tsl.
 * WebGL path is sync but wrapped in Promise for uniform call signature.
 *
 * @param atlasTexture — initial atlas (idle frames). Swap via handle.setMap later.
 * @param renderer — active renderer (from useThree().gl).
 */
export async function createIdleSpriteMaterial(
  atlasTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer | unknown,
): Promise<IdleSpriteMaterialHandle> {
  // Match sprite-material.ts:125 — `in` operator handles edge cases (mocked
  // renderers without the property at all) better than truthy-check.
  const isWebGPU = !!renderer && !('isWebGLRenderer' in (renderer as object));
  if (isWebGPU) {
    const factory = await getNodeFactory();
    return factory(atlasTexture);
  }
  return createShaderHandle(atlasTexture);
}
