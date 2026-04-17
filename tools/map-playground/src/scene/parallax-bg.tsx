import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useSceneStore } from '../store/scene-store'
import type { BgLayerConfig } from '../store/scene-types'

/** Single background sprite plane — mirrors BgLayerPlane pattern from main game. */
function BgLayerPlane({ layer }: { layer: BgLayerConfig }) {
  const texture = useTexture('/game-assets' + layer.src)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter

  const aspect = texture.image
    ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
    : 2
  const width = layer.scale * aspect * 10
  const height = layer.scale * 10

  const selectedBgId = useSceneStore((s) => s.selectedBgId)
  const selectBgLayer = useSceneStore((s) => s.selectBgLayer)
  const isSelected = selectedBgId === layer.id

  return (
    <mesh
      position={[0, layer.y, layer.z]}
      onClick={(e) => {
        e.stopPropagation()
        selectBgLayer(layer.id)
      }}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={isSelected ? layer.opacity * 0.7 : layer.opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Renders all background parallax layers from the scene store. */
export function ParallaxBg() {
  const bgLayers = useSceneStore((s) => s.bgLayers)
  return (
    <>
      {bgLayers.map((layer) => (
        <BgLayerPlane key={layer.id} layer={layer} />
      ))}
    </>
  )
}
