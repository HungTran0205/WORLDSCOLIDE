/** Dynamic grid lines that extend to cover all rooms + padding */

import { useMemo } from 'react';
import * as THREE from 'three';

interface BuildGridLinesProps {
  minX: number; minZ: number; maxX: number; maxZ: number;
}

export function BuildGridLines({ minX, minZ, maxX, maxZ }: BuildGridLinesProps) {
  const points = useMemo(() => {
    const lines: THREE.Vector3[] = [];
    for (let x = minX; x <= maxX; x++) {
      lines.push(new THREE.Vector3(x, 0.01, minZ), new THREE.Vector3(x, 0.01, maxZ));
    }
    for (let z = minZ; z <= maxZ; z++) {
      lines.push(new THREE.Vector3(minX, 0.01, z), new THREE.Vector3(maxX, 0.01, z));
    }
    return lines;
  }, [minX, minZ, maxX, maxZ]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
    </lineSegments>
  );
}
