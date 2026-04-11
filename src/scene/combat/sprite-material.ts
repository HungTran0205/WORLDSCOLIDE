/**
 * Sprite material for instanced rendering.
 *
 * WebGPU path: MeshBasicNodeMaterial + TSL — per-instance UV remapping via attribute nodes.
 * WebGL path:  ShaderMaterial with GLSL — same visual output.
 *
 * Billboard is handled via instanceMatrix (not in shader).
 */

import * as THREE from 'three';

// ─── TSL / Node Material (WebGPU) ───────────────────────────────────────────

let _nodeMaterialFactory: ((atlas: THREE.Texture) => THREE.Material) | null = null;

/**
 * Lazily build the TSL-based node material factory.
 * Imports from three/tsl are resolved at call time (tree-shakeable).
 */
async function getNodeMaterialFactory(): Promise<(atlas: THREE.Texture) => THREE.Material> {
  if (_nodeMaterialFactory) return _nodeMaterialFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { texture: textureFn, uv, attribute, vec2, mix, max: tslMax, float: tslFloat } = await import('three/tsl');

  _nodeMaterialFactory = (atlasTexture: THREE.Texture) => {
    const material = new MeshBasicNodeMaterial();
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.depthWrite = true;
    material.alphaTest = 0.1;

    // Per-instance attributes (bound via InstancedBufferAttribute on geometry)
    const aUvRect = attribute('aUvRect', 'vec4');
    const aOpacity = attribute('aOpacity', 'float');
    const aTint = attribute('aTint', 'vec3');

    // Remap base UV [0,1] to atlas sub-region
    const baseUv = uv();
    const atlasUv = vec2(
      aUvRect.x.add(baseUv.x.mul(aUvRect.z)),
      aUvRect.y.add(baseUv.y.mul(aUvRect.w)),
    );

    // Sample atlas texture at remapped UV
    const texColor = textureFn(atlasTexture, atlasUv);

    // Apply tint overlay (RGB lerp — when tint is 0,0,0 no change)
    const tintStrength = tslMax(tslMax(aTint.x, aTint.y), aTint.z);
    const finalColor = mix(texColor.xyz, aTint, tintStrength.mul(tslFloat(0.5)));

    // Set nodes
    material.colorNode = finalColor;
    material.opacityNode = texColor.w.mul(aOpacity);

    return material;
  };

  return _nodeMaterialFactory;
}

// ─── ShaderMaterial (WebGL fallback) ─────────────────────────────────────────

const vertexShader = /* glsl */ `
  attribute vec4 aUvRect;
  attribute float aOpacity;
  attribute vec3 aTint;

  varying vec2 vUv;
  varying float vOpacity;
  varying vec3 vTint;

  void main() {
    vUv = vec2(
      aUvRect.x + uv.x * aUvRect.z,
      aUvRect.y + uv.y * aUvRect.w
    );
    vOpacity = aOpacity;
    vTint = aTint;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D atlasMap;

  varying vec2 vUv;
  varying float vOpacity;
  varying vec3 vTint;

  void main() {
    vec4 texColor = texture2D(atlasMap, vUv);
    if (texColor.a < 0.1) discard;
    float tintStrength = max(max(vTint.r, vTint.g), vTint.b);
    vec3 finalColor = mix(texColor.rgb, vTint, tintStrength * 0.5);
    gl_FragColor = vec4(finalColor, texColor.a * vOpacity);
  }
`;

function createShaderSpriteMaterial(atlasTexture: THREE.Texture): THREE.Material {
  return new THREE.ShaderMaterial({
    uniforms: { atlasMap: { value: atlasTexture } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create the instanced sprite material.
 * Auto-detects renderer type: NodeMaterial for WebGPU, ShaderMaterial for WebGL.
 *
 * @param atlasTexture — The mega-atlas CanvasTexture from Phase 01
 * @param renderer — The active renderer (from useThree().gl)
 */
export async function createSpriteMaterial(
  atlasTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer | any,
): Promise<THREE.Material> {
  const isWebGPU = renderer && !('isWebGLRenderer' in renderer);

  if (isWebGPU) {
    const factory = await getNodeMaterialFactory();
    return factory(atlasTexture);
  }

  return createShaderSpriteMaterial(atlasTexture);
}

/**
 * Create instanced buffer attributes for the sprite renderer.
 * Returns the attributes + raw Float32Arrays for CPU-side updates.
 */
export function createSpriteInstanceAttributes(maxInstances: number) {
  // UV rect: (u, v, w, h) per instance
  const uvRectArray = new Float32Array(maxInstances * 4);
  const uvRectAttr = new THREE.InstancedBufferAttribute(uvRectArray, 4);
  uvRectAttr.setUsage(THREE.DynamicDrawUsage);

  // Opacity: 0 or 1 per instance
  const opacityArray = new Float32Array(maxInstances);
  opacityArray.fill(0); // hidden by default
  const opacityAttr = new THREE.InstancedBufferAttribute(opacityArray, 1);
  opacityAttr.setUsage(THREE.DynamicDrawUsage);

  // Tint: RGB per instance (0,0,0 = no tint)
  const tintArray = new Float32Array(maxInstances * 3);
  const tintAttr = new THREE.InstancedBufferAttribute(tintArray, 3);
  tintAttr.setUsage(THREE.DynamicDrawUsage);

  return {
    uvRectAttr,
    uvRectArray,
    opacityAttr,
    opacityArray,
    tintAttr,
    tintArray,
  };
}
