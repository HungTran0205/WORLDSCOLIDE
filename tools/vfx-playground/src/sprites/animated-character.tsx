import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { NearestFilter, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import type * as THREE from 'three'
import type { Direction } from './sprite-types'

export interface CharacterConfig {
  characterId: string
  animation: string
  direction: Direction | string
  position: [number, number, number]
  scale: number
  fps: number
  frames: string[]
}

interface Props {
  config: CharacterConfig
}

export function AnimatedCharacter({ config }: Props) {
  const { frames, position, scale, fps } = config
  const [textures, setTextures] = useState<Texture[]>([])

  useEffect(() => {
    let cancelled = false
    const loader = new TextureLoader()
    Promise.all(
      frames.map(
        url =>
          new Promise<Texture>((resolve, reject) => {
            loader.load(
              url,
              tex => {
                tex.magFilter = NearestFilter
                tex.minFilter = NearestFilter
                tex.colorSpace = SRGBColorSpace
                tex.generateMipmaps = false
                resolve(tex)
              },
              undefined,
              reject,
            )
          }),
      ),
    )
      .then(loaded => {
        if (cancelled) {
          loaded.forEach(t => t.dispose())
          return
        }
        setTextures(prev => {
          prev.forEach(t => t.dispose())
          return loaded
        })
      })
      .catch(err => console.error('[AnimatedCharacter] texture load error:', err))
    return () => {
      cancelled = true
    }
  }, [frames.join('|')])

  // WebGPU-compatible material (SpriteMaterial uses ShaderMaterial internally, not supported)
  const matRef = useRef(
    new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, alphaTest: 0.01 })
  )

  useEffect(() => {
    const mat = matRef.current
    return () => { mat.dispose() }
  }, [])

  const meshRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()
  const timeRef = useRef(0)
  const frameIdxRef = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Billboard: copy camera orientation so plane always faces viewer
    meshRef.current.quaternion.copy(camera.quaternion)

    if (textures.length === 0) return

    if (textures.length === 1) {
      if (matRef.current.map !== textures[0]) {
        matRef.current.map = textures[0]
        matRef.current.needsUpdate = true
      }
      return
    }

    timeRef.current += delta
    const frameDuration = 1 / Math.max(0.1, fps)
    while (timeRef.current >= frameDuration) {
      timeRef.current -= frameDuration
      frameIdxRef.current = (frameIdxRef.current + 1) % textures.length
    }
    const next = textures[frameIdxRef.current]
    if (matRef.current.map !== next) {
      matRef.current.map = next
      matRef.current.needsUpdate = true
    }
  })

  if (textures.length === 0) return null

  return (
    <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={matRef.current} attach="material" />
    </mesh>
  )
}
