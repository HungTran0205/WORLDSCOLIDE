/**
 * Combat scene lighting — flat, even illumination.
 *
 * NOTE: most combat content is unlit `meshBasicMaterial` (bg-far, bg-mid,
 * horizon gradient, sprites, foreground, and the lolo ground spec which sets
 * `lighting:'unlit'`), so these lights hit almost nothing THERE. They are NOT
 * dead weight, though: <CombatPlatform> defaults to `lighting:'lit'`, so any
 * stage that omits the override (or uses a raised lit platform / side wall)
 * relies on this ambient+directional pair to avoid rendering pure black. Keep
 * it as the safety net for lit stages; tone/shaping for the HD-2D look is
 * carried by the post-processing color-grade, not by these lights.
 */

export function CombatSceneLighting() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 5]} intensity={0.35} />
    </>
  );
}
