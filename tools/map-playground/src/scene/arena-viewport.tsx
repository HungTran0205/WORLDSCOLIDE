import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Clone, OrbitControls, useGLTF } from '@react-three/drei'
import { useSceneStore } from '../store/scene-store'
import { PlacedProps } from './placed-props'
import { ParallaxBg } from './parallax-bg'
import { VFXOverlay } from './vfx-overlay'
import { BiomeTileGrid } from './tile-grid'

/** Minimum distance (world units) before painting another tile during drag */
const PAINT_THRESHOLD = 0.8

/** Reactive ambient + directional lights driven by the lighting store. */
function SceneLights() {
  const { ambient, directional } = useSceneStore((s) => s.lighting)
  return (
    <>
      <ambientLight intensity={ambient.intensity} color={ambient.color} />
      <directionalLight
        intensity={directional.intensity}
        color={directional.color}
        position={directional.position}
        castShadow
      />
    </>
  )
}

/** Atmospheric fog driven by the lighting store. */
function SceneFog() {
  const fogColor = useSceneStore((s) => s.lighting.fogColor)
  return <fog attach="fog" args={[fogColor, 15, 40]} />
}

/** Diorama GLB ground model — replaces static cave preview when set. */
function DioramaModel() {
  const diorama = useSceneStore((s) => s.diorama)
  if (!diorama) return null
  const { scene } = useGLTF('/game-assets' + diorama.src)
  return <Clone object={scene} scale={diorama.scale} position={[0, diorama.y, 0]} />
}

/** Invisible floor plane that receives pointer events for click-to-place and drag-paint. */
function FloorPlane() {
  const pendingAsset = useSceneStore((s) => s.pendingAsset)
  const placeProp = useSceneStore((s) => s.placeProp)
  const paintProp = useSceneStore((s) => s.paintProp)
  const startPaintSession = useSceneStore((s) => s.startPaintSession)
  const placeVFX = useSceneStore((s) => s.placeVFX)
  const setGhostPosition = useSceneStore((s) => s.setGhostPosition)
  const selectProp = useSceneStore((s) => s.selectProp)
  const selectBgLayer = useSceneStore((s) => s.selectBgLayer)
  const selectVFX = useSceneStore((s) => s.selectVFX)

  // Drag-paint state — refs avoid re-render overhead
  const isDragging = useRef(false)
  const lastPaintPos = useRef<[number, number, number] | null>(null)

  function dist(a: [number, number, number], b: [number, number, number]) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2)  // XZ distance only
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={(e) => {
        const pos: [number, number, number] = [e.point.x, e.point.y, e.point.z]
        if (pendingAsset && (pendingAsset.type === 'prop3D' || pendingAsset.type === 'tile')) {
          setGhostPosition(pos)
        }
        // Drag-paint: place tiles while holding mouse button
        if (isDragging.current && pendingAsset?.type === 'tile') {
          if (!lastPaintPos.current || dist(pos, lastPaintPos.current) >= PAINT_THRESHOLD) {
            paintProp(pos)
            lastPaintPos.current = pos
          }
        }
      }}
      onPointerDown={(e) => {
        // Right-click only for placement — left-click is reserved for camera pan
        if (e.button !== 2) return
        const pos: [number, number, number] = [e.point.x, e.point.y, e.point.z]
        if (pendingAsset?.type === 'tile') {
          e.stopPropagation()
          startPaintSession()
          placeProp(pos)
          isDragging.current = true
          lastPaintPos.current = pos
        } else if (pendingAsset?.type === 'prop3D') {
          e.stopPropagation()
          placeProp(pos)
        } else if (pendingAsset?.type === 'vfx') {
          e.stopPropagation()
          placeVFX(pendingAsset.src, pos)
        } else {
          selectProp(null)
          selectBgLayer(null)
          selectVFX(null)
        }
      }}
      onPointerUp={() => {
        isDragging.current = false
        lastPaintPos.current = null
      }}
      onPointerLeave={() => {
        isDragging.current = false
        lastPaintPos.current = null
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

interface ArenaViewportProps {
  /** When true: left-drag rotates camera, placement clicks disabled */
  cameraMode: boolean
}

/** R3F Canvas with orthographic camera matching main game (zoom:76, pos:[0,7.5,15]). */
export function ArenaViewport({ cameraMode }: ArenaViewportProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 7.5, 15], zoom: 76, near: 0.1, far: 1000 }}
      shadows
      frameloop="always"
    >
      <SceneFog />
      <SceneLights />

      {import.meta.env.DEV && <gridHelper args={[20, 20, '#444', '#333']} />}

      {/* Only render floor interaction plane in placement mode */}
      {!cameraMode && <FloorPlane />}

      <Suspense fallback={null}>
        <BiomeTileGrid />
        <DioramaModel />
        <ParallaxBg />
        <PlacedProps />
        <VFXOverlay />
      </Suspense>

      <OrbitControls
        enableRotate={cameraMode}
        mouseButtons={cameraMode
          // Orbit mode: left=rotate, right=pan
          ? { LEFT: 0, MIDDLE: 1, RIGHT: 2 }
          // Placement mode: left=pan, right=disabled (-1 hits default case → no action)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : { LEFT: 2, MIDDLE: 1, RIGHT: -1 as any }
        }
        enablePan={true}
        enableZoom={true}
        minZoom={20}
        maxZoom={200}
      />
    </Canvas>
  )
}
