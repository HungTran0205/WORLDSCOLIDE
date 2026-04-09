import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { GuildHall } from './guild-hall';
import { MemberLayer } from './member-layer';
import { CameraController } from './camera-controller';
import { FacilityRoomsLayer } from './facility-rooms-layer';
import { createWebGPURenderer, WebGPUInit } from './webgpu-init';

/** Nulls out scene.background so the CSS cave image shows through the canvas */
function TransparentBackground() {
  const { scene } = useThree();
  useEffect(() => { scene.background = null; }, [scene]);
  return null;
}

/** Main 3D world — isometric guild hall view */
export function World() {
  return (
    <Canvas
      frameloop="demand"
      orthographic
      camera={{ zoom: 65, position: [15, 10, 14], near: 0.1, far: 1000 }}
      dpr={[1, 1.5]}
      gl={createWebGPURenderer}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <WebGPUInit />
      <TransparentBackground />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />

      <CameraController />
      <Suspense fallback={null}>
        <GuildHall />
        <FacilityRoomsLayer />
        <MemberLayer />
      </Suspense>
    </Canvas>
  );
}
