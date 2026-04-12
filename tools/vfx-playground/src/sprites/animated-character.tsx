import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { NearestFilter, SRGBColorSpace, Texture, TextureLoader } from 'three'
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

  useEffect(() => {
    return () => {
      textures.forEach(t => t.dispose())
    }
  }, [])

  const spriteRef = useRef<THREE.Sprite>(null!)
  const timeRef = useRef(0)
  const frameIdxRef = useRef(0)

  useFrame((_, delta) => {
    if (textures.length === 0 || !spriteRef.current) return
    if (textures.length === 1) {
      if (spriteRef.current.material.map !== textures[0]) {
        spriteRef.current.material.map = textures[0]
        spriteRef.current.material.needsUpdate = true
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
    if (spriteRef.current.material.map !== next) {
      spriteRef.current.material.map = next
      spriteRef.current.material.needsUpdate = true
    }
  })

  if (textures.length === 0) return null

  return (
    <sprite ref={spriteRef} position={position} scale={[scale, scale, scale]}>
      <spriteMaterial
        attach="material"
        map={textures[0]}
        transparent
        alphaTest={0.01}
        depthWrite={false}
      />
    </sprite>
  )
}
