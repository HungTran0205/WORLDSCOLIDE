import { useRef } from 'react'
import { OrthographicCamera, OrbitControls, Grid } from '@react-three/drei'

const ISO_POS: [number, number, number] = [10, 10, 10]

export function SceneSetup() {
  const controlsRef = useRef(null)

  return (
    <>
      {/* Isometric camera: equal x/y/z position → 45° azimuth, ~35.264° elevation */}
      <OrthographicCamera
        makeDefault
        position={ISO_POS}
        zoom={40}
        near={0.1}
        far={1000}
      />

      <OrbitControls
        ref={controlsRef}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
      />

      {/* Ground grid */}
      <Grid
        position={[0, 0, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a2a3a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444466"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Axes helper for spatial reference */}
      <axesHelper args={[3]} />
    </>
  )
}
