# Phase 2: Arena Environment

## Overview
- **Priority**: High
- **Status**: complete
- Replace flat ground with placeholder arena environment: background wall, ground zone indicators, side boundaries, adjusted lighting.

## Related Files
- `src/scene/combat-arena-environment.tsx` — full rewrite of environment geometry

## Implementation Steps

### 1. Ground plane
Keep existing ground but adjust for new camera perspective:
- Size: 20×10 (slightly narrower in Z for beat-em-up feel)
- Color: Dark arena floor `#2a2a2a` or `#3a3a3a`
- Keep ally/enemy zone indicators but make them subtler

### 2. Background wall (placeholder)
Add tall plane behind the arena (far side from camera):
```tsx
{/* Background wall placeholder — user replaces with 3D model later */}
<mesh position={[0, 3, -5]} >
  <planeGeometry args={[22, 8]} />
  <meshStandardMaterial color="#1a1a2a" />
</mesh>
```

### 3. Side boundaries (placeholder)
Optional side planes to frame the arena:
```tsx
{/* Left boundary */}
<mesh position={[-10, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
  <planeGeometry args={[10, 6]} />
  <meshStandardMaterial color="#1a1a2a" transparent opacity={0.5} />
</mesh>
{/* Right boundary */}
<mesh position={[10, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
  <planeGeometry args={[10, 6]} />
  <meshStandardMaterial color="#1a1a2a" transparent opacity={0.5} />
</mesh>
```

### 4. Lighting adjustment
Adjust directional light for front-above angle (beat-em-up):
```tsx
<ambientLight intensity={0.6} />
<directionalLight position={[0, 8, 6]} intensity={0.8} />
```

Light from front-above creates shadows toward back, matching camera perspective.

### 5. Center line indicator
Subtle divider line at x=0 showing the clash zone:
```tsx
<mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[0.05, 10]} />
  <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
</mesh>
```

## TODO
- [x] Resize ground plane to 20×10, darken color
- [x] Update ally/enemy zone indicators for new dimensions
- [x] Add background wall placeholder
- [x] Add side boundary placeholders
- [x] Adjust lighting for front-above direction
- [x] Add center line indicator
- [x] Verify all placeholders render correctly with new camera angle

## Success Criteria
- Arena feels enclosed, like a fighting arena
- Placeholders are clearly placeholder (simple geometry, dark colors)
- Easy to replace placeholder meshes with user's 3D objects later
- Lighting creates proper depth perception from beat-em-up angle
- No visual artifacts or clipping with entity sprites
