import * as THREE from 'three';

/** Converts MeshBasicMaterial → MeshStandardMaterial so dynamic lights and
 *  shadow maps affect the mesh. Also sets castShadow + receiveShadow flags. */
export function applyLitMaterial(root: THREE.Group) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material;
    if (mat.type === 'MeshBasicMaterial') {
      const b = mat as THREE.MeshBasicMaterial;
      mesh.material = new THREE.MeshStandardMaterial({
        map: b.map, color: b.color,
        transparent: b.transparent, opacity: b.opacity,
        roughness: 0.8, metalness: 0.1,
      });
      // Don't dispose b — it's shared with the cached GLB scene; other clones still reference it
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}
