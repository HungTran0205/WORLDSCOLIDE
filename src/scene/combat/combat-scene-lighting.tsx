/**
 * Combat scene lighting — flat, even illumination so sprite alpha looks crisp
 * on the solid black backdrop. Ambient does the heavy lifting; a soft
 * directional light gives just enough variation to avoid pure-flat look.
 */

export function CombatSceneLighting() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 5]} intensity={0.35} />
    </>
  );
}
