/**
 * GrassBladeMaterial — dual-path material for instanced billboard grass tufts
 * with a vertex wind-sway.
 *
 * Sway: each blade bends along its LOCAL X by
 *   sin(time * speed + phase) * amplitude * heightFactor
 * where heightFactor = localY / bladeHeight (0 at the planted base, 1 at the
 * tip). The base stays rooted; only the top wobbles — reads as grass in wind.
 *
 * WebGPU path uses MeshBasicNodeMaterial.positionNode (TSL). This is the ONLY
 * way to displace verts under WebGPURenderer — onBeforeCompile / ShaderMaterial
 * GLSL injection does not run on WebGPU. WebGL path mirrors the same math in
 * GLSL so the effect survives a WebGL fallback renderer.
 *
 * Per-instance phase spread:
 *   - WebGPU: float(instanceIndex)  — cheap builtin, random-ish per blade.
 *   - WebGL : instance world XZ     — spatial wave across the field.
 * Minor visual divergence between renderers; fine for ambient foliage.
 *
 * Renderer detection mirrors idle-sprite-material.ts (`isWebGLRenderer` probe).
 */

import * as THREE from 'three';

export interface GrassMaterialHandle {
  material: THREE.Material;
  /** Advance the wind animation — call every frame with clock.elapsedTime. */
  setTime: (t: number) => void;
  dispose: () => void;
}

export interface GrassSwayParams {
  /** Local geometry height (base at y=0, tip at y=bladeHeight). */
  bladeHeight: number;
  /** Sway angular speed (rad/sec). */
  swaySpeed?: number;
  /** Horizontal tip displacement in local units at full height. */
  swayAmp?: number;
  /** Per-instance phase spread factor. */
  phaseStep?: number;
  /** Alpha cutout threshold. */
  alphaTest?: number;
}

const DEFAULTS = { swaySpeed: 1.6, swayAmp: 0.12, phaseStep: 0.6, alphaTest: 0.5 };

// ─── WebGPU path (TSL NodeMaterial) ──────────────────────────────────────────

let _nodeFactory:
  | ((tex: THREE.Texture, p: GrassSwayParams) => GrassMaterialHandle)
  | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { texture: textureFn, uv, positionLocal, uniform, vec3, sin, float, instanceIndex } =
    await import('three/tsl');

  _nodeFactory = (tex: THREE.Texture, p: GrassSwayParams) => {
    const { bladeHeight, swaySpeed, swayAmp, phaseStep, alphaTest } = { ...DEFAULTS, ...p };

    const material = new MeshBasicNodeMaterial();
    // Pixel-art cutout: hard alpha edges, no blend → no transparent sort.
    material.transparent = false;
    material.alphaTest = alphaTest;
    material.side = THREE.DoubleSide;
    material.depthWrite = true;

    const uTime = uniform(0);

    // heightFactor 0..1 over the blade. positionLocal is pre-instance-matrix,
    // so this stays correct regardless of per-instance scale.
    const heightFactor = positionLocal.y.div(bladeHeight);
    const phase = uTime.mul(swaySpeed).add(float(instanceIndex).mul(phaseStep));
    const swayX = sin(phase).mul(swayAmp).mul(heightFactor);
    material.positionNode = vec3(positionLocal.x.add(swayX), positionLocal.y, positionLocal.z);

    const texNode = textureFn(tex, uv());
    material.colorNode = texNode.xyz;
    material.opacityNode = texNode.w;

    return {
      material,
      setTime: (t: number) => {
        (uTime as unknown as { value: number }).value = t;
      },
      dispose: () => material.dispose(),
    };
  };

  return _nodeFactory;
}

// ─── WebGL path (ShaderMaterial) ─────────────────────────────────────────────

// `instanceMatrix`, `position`, `uv`, modelView/projection matrices are
// declared by three's prefixVertex when USE_INSTANCING is active — do NOT
// redeclare them here.
const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSwaySpeed;
  uniform float uSwayAmp;
  uniform float uBladeHeight;
  uniform float uPhaseStep;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    float hf = clamp(position.y / uBladeHeight, 0.0, 1.0);
    vec3 iPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    float phase = uTime * uSwaySpeed + (iPos.x + iPos.z) * uPhaseStep;
    float swayX = sin(phase) * uSwayAmp * hf;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position + vec3(swayX, 0.0, 0.0), 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uAlphaTest;
  varying vec2 vUv;

  void main() {
    vec4 c = texture2D(uMap, vUv);
    if (c.a < uAlphaTest) discard;
    gl_FragColor = vec4(c.rgb, c.a);
  }
`;

function createShaderHandle(tex: THREE.Texture, p: GrassSwayParams): GrassMaterialHandle {
  const { bladeHeight, swaySpeed, swayAmp, phaseStep, alphaTest } = { ...DEFAULTS, ...p };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: tex },
      uTime: { value: 0 },
      uSwaySpeed: { value: swaySpeed },
      uSwayAmp: { value: swayAmp },
      uBladeHeight: { value: bladeHeight },
      // spatial wave in world units → scale up vs the per-index WebGPU spread
      uPhaseStep: { value: phaseStep * 2.0 },
      uAlphaTest: { value: alphaTest },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  });

  return {
    material,
    setTime: (t: number) => {
      material.uniforms.uTime.value = t;
    },
    dispose: () => material.dispose(),
  };
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Create a grass-blade material. Auto-detects renderer: WebGPU → TSL
 * NodeMaterial, WebGL → ShaderMaterial. WebGPU path is async (dynamic import
 * of three/webgpu + three/tsl); WebGL is wrapped in Promise for one signature.
 */
export async function createGrassMaterial(
  tex: THREE.Texture,
  renderer: THREE.WebGLRenderer | unknown,
  params: GrassSwayParams,
): Promise<GrassMaterialHandle> {
  const isWebGPU = !!renderer && !('isWebGLRenderer' in (renderer as object));
  if (isWebGPU) {
    const factory = await getNodeFactory();
    return factory(tex, params);
  }
  return createShaderHandle(tex, params);
}
