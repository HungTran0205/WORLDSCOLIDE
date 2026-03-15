import { OrbitControls } from '@react-three/drei';
import { useGameStore } from '@/game/state/store';

/** Fixed isometric camera — zoom/pan only, no rotation. Pan disabled during build mode. */
export function CameraController() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);

  return (
    <OrbitControls
      enableRotate={false}
      enablePan={!isBuildMode}
      enableZoom={true}
      minZoom={40}
      maxZoom={150}
      target={[0, 0, 0]}
    />
  );
}
