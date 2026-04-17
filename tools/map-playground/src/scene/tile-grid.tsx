/**
 * TileGrid — instanced floor tiles for map-playground, mirrors main game CombatTileGrid.
 * Renders automatically for forest biome (which uses tilePrimary/tileAccent in game).
 * Paths served via /game-assets/ Vite plugin proxy.
 */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../store/scene-store'

const PRIMARY_SRC = '/game-assets/tiles/t_Green_Tile_of_Grass.glb'
const ACCENT_SRC  = '/game-assets/tiles/t_Cork_Tile.glb'
const TILE_SIZE   = 1.75
const GRID_WIDTH  = 64
const GRID_DEPTH  = 9
const FADE_ROWS   = 3
const FADE_ROWS_TOP = 1

interface TilePos { x: number; y: number; z: number }

/** Pull first Mesh geometry + material from GLB scene graph */
function extractMesh(scene: THREE.Group): { geo: THREE.BufferGeometry; mat: THREE.Material } | null {
  let geo: THREE.BufferGeometry | null = null
  let mat: THREE.Material | null = null
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && !geo) {
      geo = o.geometry as THREE.BufferGeometry
      mat = o.material as THREE.Material
    }
  })
  return geo && mat ? { geo, mat } : null
}

function TileInstances({ geo, mat, positions, scale }: {
  geo: THREE.BufferGeometry; mat: THREE.Material; positions: TilePos[]; scale: number
}) {
  const mesh = useMemo(() => {
    if (geo.index && geo.drawRange.count === Infinity) {
      geo.setDrawRange(0, geo.index.count)
    }
    const m = new THREE.InstancedMesh(geo, mat, positions.length)
    const matrix = new THREE.Matrix4()
    const s = new THREE.Vector3(scale, scale, scale)
    positions.forEach((p, i) => {
      matrix.compose(new THREE.Vector3(p.x, p.y, p.z), new THREE.Quaternion(), s)
      m.setMatrixAt(i, matrix)
    })
    m.instanceMatrix.needsUpdate = true
    return m
  }, [geo, mat, positions, scale])
  return <primitive object={mesh} />
}

/** Gradient fade plane: fogColor at outer edge → transparent at inner edge */
function EdgeFadePlane({ width, zCenter, planeDepth, fogColor, flipGradient }: {
  width: number; zCenter: number; planeDepth: number; fogColor: string; flipGradient: boolean
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1; canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 64)
    if (flipGradient) {
      g.addColorStop(0, 'transparent'); g.addColorStop(1, fogColor)
    } else {
      g.addColorStop(0, fogColor); g.addColorStop(1, 'transparent')
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 64)
    return new THREE.CanvasTexture(canvas)
  }, [fogColor, flipGradient])

  return (
    <mesh position={[0, 0.1, zCenter]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, planeDepth]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Renders instanced tile floor — only for forest biome (cave uses diorama GLB). */
export function BiomeTileGrid() {
  const biome = useSceneStore((s) => s.biome)
  const fogColor = useSceneStore((s) => s.lighting.fogColor)
  const primary = useGLTF(PRIMARY_SRC)
  const accent  = useGLTF(ACCENT_SRC)

  const primaryMesh = useMemo(() => extractMesh(primary.scene), [primary.scene])
  const accentMesh  = useMemo(() => extractMesh(accent.scene),  [accent.scene])

  const topFade   = FADE_ROWS_TOP * TILE_SIZE
  const botFade   = FADE_ROWS    * TILE_SIZE
  const totalDepth = GRID_DEPTH + topFade + botFade
  const cols      = Math.ceil(GRID_WIDTH  / TILE_SIZE)
  const totalRows = Math.ceil(totalDepth / TILE_SIZE)

  const { primaryPos, accentPos } = useMemo(() => {
    const p: TilePos[] = [], a: TilePos[] = []
    const startX = -GRID_WIDTH / 2 + TILE_SIZE / 2
    const startZ = -(GRID_DEPTH / 2) - topFade + TILE_SIZE / 2
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * TILE_SIZE
        const z = startZ + row * TILE_SIZE;
        (Math.abs(z) < 2.5 ? a : p).push({ x, y: -0.1, z })
      }
    }
    return { primaryPos: p, accentPos: a }
  }, [topFade, totalRows])

  if (biome !== 'forest' || !primaryMesh) return null

  const halfDepth = GRID_DEPTH / 2
  return (
    <group>
      {primaryPos.length > 0 && (
        <TileInstances geo={primaryMesh.geo} mat={primaryMesh.mat} positions={primaryPos} scale={TILE_SIZE} />
      )}
      {accentMesh && accentPos.length > 0 && (
        <TileInstances geo={accentMesh.geo} mat={accentMesh.mat} positions={accentPos} scale={TILE_SIZE} />
      )}
      <EdgeFadePlane width={GRID_WIDTH} zCenter={-(halfDepth + topFade / 2)} planeDepth={topFade} fogColor={fogColor} flipGradient={false} />
      <EdgeFadePlane width={GRID_WIDTH} zCenter={+(halfDepth + botFade / 2)} planeDepth={botFade} fogColor={fogColor} flipGradient={true} />
    </group>
  )
}

// Preload both tile GLBs on module load
useGLTF.preload(PRIMARY_SRC)
useGLTF.preload(ACCENT_SRC)
