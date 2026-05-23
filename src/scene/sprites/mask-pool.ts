import { TextureLoader, NearestFilter, SRGBColorSpace, type Texture } from 'three';
import { assetUrl } from '@/lib/asset-url';

/** 21 curated identity masks, located in public/sprites/mask/pick/{id}/{view}.png */
export const MASK_POOL = [
  'mask-01', 'mask-02', 'mask-03', 'mask-04', 'mask-05',
  'mask-06', 'mask-07', 'mask-08', 'mask-09', 'mask-10',
  'mask-11', 'mask-12', 'mask-13', 'mask-14', 'mask-15',
  'mask-16', 'mask-17', 'mask-18', 'mask-19', 'mask-20',
  'mask-21',
] as const;

export type MaskId = typeof MASK_POOL[number];
export type MaskView = 'front' | 'east';

/** Founder mask choices for char-creation — first 10 of the pool (single source, DRY). */
export const FOUNDER_MASK_CHOICES: MaskId[] = MASK_POOL.slice(0, 10);

/** Narrative shown above the mask grid in the founder Mask step (English copy). */
export const FOUNDER_MASK_NARRATIVE =
  'In this broken world, malevolent eyes watch from above the heavens — your identity is your most precious possession. Choose the face you show the world.';

/** Asset path resolver. `front` for roster portrait, `east` for combat profile (source is east-facing; mirror via scale.x for west). */
export function getMaskAssetPath(id: string, view: MaskView): string {
  return assetUrl(`/sprites/mask/pick/${id}/${view}.png`);
}

/** Deterministic hash-based selector — same memberId → same mask */
export function selectMaskForMember(memberId: string): MaskId {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = ((hash << 5) - hash + memberId.charCodeAt(i)) | 0;
  }
  return MASK_POOL[Math.abs(hash) % MASK_POOL.length];
}

/** Resolve mask ID for a member — uses persisted maskSpriteId or lazy hash */
export function resolveMemberMaskId(member: { id: string; maskSpriteId?: string }): string {
  return member.maskSpriteId ?? selectMaskForMember(member.id);
}

const textureCache = new Map<string, Texture>();
const loader = new TextureLoader();

/** Three.js texture cache — shared across roster+combat to avoid double-load */
export function loadMaskTexture(id: string, view: MaskView): Texture {
  const path = getMaskAssetPath(id, view);
  const cached = textureCache.get(path);
  if (cached) return cached;
  const tex = loader.load(path);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace; // PNG source — avoid darkened/washed output under tonemapping
  textureCache.set(path, tex);
  return tex;
}

/** Preload all 21 east textures on app boot — eliminate combat pop-in. ~170KB total. */
export function preloadCombatMasks(): void {
  MASK_POOL.forEach(id => loadMaskTexture(id, 'east'));
}
