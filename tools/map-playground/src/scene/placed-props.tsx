import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '../store/scene-store'
import type { PlacedProp } from '../store/scene-types'

/** Renders a single placed GLB prop. Applies orange emissive tint when selected. */
function PlacedPropMesh({ prop }: { prop: PlacedProp }) {
  const { scene } = useGLTF('/game-assets' + prop.src)
  const clone = useMemo(() => scene.clone(), [scene])
  const selected = useSceneStore((s) => s.selectedId === prop.id)
  const selectProp = useSceneStore((s) => s.selectProp)

  useEffect(() => {
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
      mat.emissive = mat.emissive ?? new THREE.Color(0, 0, 0)
      mat.emissive.set(selected ? '#ff6600' : '#000000')
      mat.emissiveIntensity = selected ? 0.5 : 0
      mesh.material = mat
    })
  }, [selected, clone])

  return (
    <primitive
      object={clone}
      position={prop.position}
      rotation={prop.rotation}
      scale={prop.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        selectProp(prop.id)
      }}
    />
  )
}

/** Semi-transparent ghost preview that follows the mouse during click-to-place. */
function GhostPreview({ src, position }: { src: string; position: [number, number, number] }) {
  const { scene } = useGLTF('/game-assets' + src)
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial
      mat.transparent = true
      mat.opacity = 0.5
      mesh.material = mat
    })
    return c
  }, [scene])

  return <primitive object={clone} position={position} scale={0.1} />
}

/** Renders all placed props from the store, plus a ghost preview for pending placement. */
export function PlacedProps() {
  const placedProps = useSceneStore((s) => s.placedProps)
  const pendingAsset = useSceneStore((s) => s.pendingAsset)
  const ghostPosition = useSceneStore((s) => s.ghostPosition)

  return (
    <>
      {placedProps.map((prop) => (
        <PlacedPropMesh key={prop.id} prop={prop} />
      ))}
      {pendingAsset && (pendingAsset.type === 'prop3D' || pendingAsset.type === 'tile') && ghostPosition && (
        <GhostPreview src={pendingAsset.src} position={ghostPosition} />
      )}
    </>
  )
}
