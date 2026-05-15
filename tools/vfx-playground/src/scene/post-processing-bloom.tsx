import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PostProcessing, type WebGPURenderer } from 'three/webgpu'
import { pass } from 'three/tsl'
import BloomNode from 'three/examples/jsm/tsl/display/BloomNode.js'

interface Props {
  strength: number
  radius: number
  threshold: number
}

interface BloomUniform {
  value: number
}

interface BloomNodeInstance {
  strength: BloomUniform
  radius: BloomUniform
  threshold: BloomUniform
}

/**
 * WebGPU bloom postprocessing pass.
 * Mounted once per Canvas. Persistent <AllPresetParticles> guarantees no
 * VFXParticles unmount mid-frame, so the previous "Buffer used in submit
 * while destroyed" race is gone — no dispose useEffect / try-catch needed.
 */
export function PostProcessingBloom({ strength, radius, threshold }: Props) {
  const gl = useThree(s => s.gl) as unknown as WebGPURenderer
  const scene = useThree(s => s.scene)
  const camera = useThree(s => s.camera)

  const setup = useMemo(() => {
    if (!gl || !(gl as any).isWebGPURenderer) return null
    const post = new PostProcessing(gl as any)
    const scenePass = pass(scene as any, camera as any)
    const sceneColor = scenePass.getTextureNode('output')
    const bloomNode = new (BloomNode as any)(sceneColor, strength, radius, threshold) as BloomNodeInstance & {
      isNode: boolean
    }
    post.outputNode = (sceneColor as any).add(bloomNode)
    return { post, bloomNode }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    if (!setup) return
    setup.bloomNode.strength.value = strength
    setup.bloomNode.radius.value = radius
    setup.bloomNode.threshold.value = threshold
  }, [setup, strength, radius, threshold])

  useFrame(() => {
    if (!setup) return
    setup.post.render()
  }, 1)

  return null
}
