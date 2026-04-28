/**
 * Procedural floor tile textures — generates Canvas2D textures
 * with wood grain, stone cracks, cement speckle patterns.
 * Textures are cached by color hex to avoid regeneration.
 */

import * as THREE from 'three';

const TEX_SIZE = 64;

/** Seeded pseudo-random for deterministic textures per color */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Convert hex color to RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Simple hash from string for seeding */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Detect material type from color hex — maps palette colors to texture styles */
function detectMaterial(hex: string): 'wood' | 'stone' | 'cement' {
  const lower = hex.toLowerCase();
  // Wood tones: gold, wood-brown
  if (lower === '#daa520' || lower === '#8b4513') return 'wood';
  // Stone/mineral tones: slate, stone, obsidian, steel-blue, royal-blue
  if (['#708090', '#a0a0a0', '#1c1c1c', '#4682b4', '#4169e1'].includes(lower)) return 'stone';
  // Cement-like: ivory, crimson, forest (painted cement look)
  return 'cement';
}

/** Draw wood grain pattern */
function drawWoodGrain(ctx: CanvasRenderingContext2D, baseColor: string, rand: () => number) {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Wood grain lines
  for (let i = 0; i < 12; i++) {
    const y = rand() * TEX_SIZE;
    const thickness = 0.5 + rand() * 1.5;
    const darken = 0.08 + rand() * 0.12;
    ctx.strokeStyle = `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 30)},${Math.max(0, b - 20)},${darken})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // Slightly wavy line
    for (let x = 0; x < TEX_SIZE; x += 8) {
      ctx.lineTo(x, y + (rand() - 0.5) * 3);
    }
    ctx.lineTo(TEX_SIZE, y + (rand() - 0.5) * 3);
    ctx.stroke();
  }

  // Subtle knot spots
  for (let i = 0; i < 2; i++) {
    if (rand() > 0.5) continue;
    const kx = rand() * TEX_SIZE;
    const ky = rand() * TEX_SIZE;
    const kr = 2 + rand() * 3;
    ctx.fillStyle = `rgba(${Math.max(0, r - 50)},${Math.max(0, g - 40)},${Math.max(0, b - 30)},0.15)`;
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Plank border (thin dark line at edges)
  ctx.strokeStyle = `rgba(0,0,0,0.12)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TEX_SIZE - 1, TEX_SIZE - 1);
}

/** Draw stone/rock pattern */
function drawStonePattern(ctx: CanvasRenderingContext2D, baseColor: string, rand: () => number) {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Random speckles for stone texture
  for (let i = 0; i < 80; i++) {
    const sx = rand() * TEX_SIZE;
    const sy = rand() * TEX_SIZE;
    const sr = 0.5 + rand() * 1.5;
    const light = rand() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255,255,255,${0.03 + rand() * 0.06})`
      : `rgba(0,0,0,${0.03 + rand() * 0.06})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crack lines
  for (let i = 0; i < 3; i++) {
    if (rand() > 0.6) continue;
    ctx.strokeStyle = `rgba(0,0,0,${0.06 + rand() * 0.08})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    let cx = rand() * TEX_SIZE;
    let cy = rand() * TEX_SIZE;
    ctx.moveTo(cx, cy);
    const steps = 3 + Math.floor(rand() * 4);
    for (let s = 0; s < steps; s++) {
      cx += (rand() - 0.5) * 16;
      cy += (rand() - 0.5) * 16;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Border bevel
  ctx.strokeStyle = `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)},0.15)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1, TEX_SIZE - 1);
  ctx.lineTo(1, 1);
  ctx.lineTo(TEX_SIZE - 1, 1);
  ctx.stroke();
  ctx.strokeStyle = `rgba(0,0,0,0.1)`;
  ctx.beginPath();
  ctx.moveTo(TEX_SIZE - 1, 1);
  ctx.lineTo(TEX_SIZE - 1, TEX_SIZE - 1);
  ctx.lineTo(1, TEX_SIZE - 1);
  ctx.stroke();
}

/** Draw cement/concrete pattern */
function drawCementPattern(ctx: CanvasRenderingContext2D, baseColor: string, rand: () => number) {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Fine noise speckles (cement texture)
  for (let i = 0; i < 120; i++) {
    const sx = rand() * TEX_SIZE;
    const sy = rand() * TEX_SIZE;
    const sr = 0.3 + rand() * 0.8;
    const light = rand() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255,255,255,${0.02 + rand() * 0.04})`
      : `rgba(0,0,0,${0.02 + rand() * 0.04})`;
    ctx.fillRect(sx, sy, sr, sr);
  }

  // Subtle surface variation (larger blotches)
  for (let i = 0; i < 4; i++) {
    const bx = rand() * TEX_SIZE;
    const by = rand() * TEX_SIZE;
    const br = 6 + rand() * 10;
    ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + rand() * 0.1})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge groove
  ctx.strokeStyle = `rgba(0,0,0,0.08)`;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(1, 1, TEX_SIZE - 2, TEX_SIZE - 2);
}

const canvasCache = new Map<string, HTMLCanvasElement>();

/** Get or create a procedural texture for a floor tile color */
export function getFloorTileTexture(colorHex: string): THREE.CanvasTexture {
  let canvas = canvasCache.get(colorHex);

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d')!;
    const rand = seededRandom(hashString(colorHex));
    const material = detectMaterial(colorHex);

    switch (material) {
      case 'wood':
        drawWoodGrain(ctx, colorHex, rand);
        break;
      case 'stone':
        drawStonePattern(ctx, colorHex, rand);
        break;
      case 'cement':
        drawCementPattern(ctx, colorHex, rand);
        break;
    }
    canvasCache.set(colorHex, canvas);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  // Explicitly tag it for WebGPU upload
  texture.needsUpdate = true;
  return texture;
}
