import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Clone, OrbitControls, useGLTF } from '@react-three/drei'
import { useSceneStore } from '../store/scene-store'
import { PlacedProps } from './placed-props'

const CAVE_DIORAMA = '/game-assets/arena/cave/3dtiles/optimized/groundcave.glb'

/**
 * Temporary static cave preview — confirms camera angle matches main game.
 * Uses <Clone> so useGLTF's cached scene object is not mutated by R3F.
 * Replaced by store-driven system in Phase 3+.
 */
function StaticCavePreview() {
  const { scene } = useGLTF(CAVE_DIORAMA)
  return <Clone object={scene} scale={12} position={[0, -1, 0]} />
}

/** R3F Canvas with orthographic camera matching main game (zoom:76, pos:[0,7.5,15]) */
export function ArenaViewport() {
  const pendingAsset = useSceneStore(s => s.pendingAsset)

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 7.5, 15], zoom: 76, near: 0.1, far: 1000 }}
      shadows
    >
      {/* Lighting defaults from CAVE_CONFIG */}
      <ambientLight intensity={3} color="#8080c0" />
      <directionalLight intensity={3} color="#a0a0ff" position={[0, 8, 4]} castShadow />

      {/* Debug orientation grid — dev only */}
      {import.meta.env.DEV && <gridHelper args={[20, 20, '#444', '#333']} />}

      {/*
       * Invisible floor plane — receives pointer events for click-to-place.
       * Phase 3 will wire onPointerDown → placeProp(e.point).
       */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          if (pendingAsset) {
            e.stopPropagation()
            // Phase 3: placeProp(e.point)
            console.log('[floor] click at', e.point)
          }
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <Suspense fallback={null}>
        <StaticCavePreview />
      </Suspense>

      {/* Props from store — populated Phase 3+ */}
      <PlacedProps />

      <OrbitControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        minZoom={20}
        maxZoom={200}
      />
    </Canvas>
  )
}
