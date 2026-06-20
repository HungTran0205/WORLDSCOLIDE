import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';
import { FloorDecal } from '@/scene/sprites/floor-decal';
import { assetUrl } from '@/lib/asset-url';

useGLTF.preload(assetUrl('/models/furnitures/Infrimary_Ember_Engine.glb'));
useGLTF.preload(assetUrl('/models/furnitures/Infrimary_Brassbound_Treasure.glb'));

export function InfirmaryFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Đông Sơn drum seal under the ether crystal — focal accent radiating
          from the altar base (center hidden under the engine, outer bands show). */}
      <FloorDecal
        position={[cx, 0, cz - 0.1]}
        size={[4.2, 4.2]}
        texture="/decals/floor/dongson-drum-seal.png"
        opacity={0.9}
        yOffset={0.02}
      />
      <RoomProp path="/models/furnitures/Infrimary_Brassbound_Treasure.glb" position={[cx - 2.5, 0, cz - 2.5]} targetHeight={1} rotY={Math.PI / 2} />
      <RoomProp path="/models/furnitures/Infrimary_Verdant_Vault.glb" position={[cx + 2.5, 0, cz - 0.6]} targetHeight={1} rotY={0} />
      <RoomProp path="/models/furnitures/Infrimary_Verdant_Vault.glb" position={[cx + 0.8, 0, cz - 2.5]} targetHeight={1} rotY={-Math.PI / 2} />
      <RoomProp path="/models/furnitures/Infrimary_Pipe_Cross_Junction.glb" position={[cx - 1, 0, cz - 2.5]} targetHeight={0.5} rotY={-Math.PI / 2} />
      <RoomProp path="/models/furnitures/Infrimary_Pipe_Cross_Junction.glb" position={[cx + 1.7, 0, cz - 2.5]} targetHeight={0.5} rotY={-Math.PI / 2} />
      <RoomProp path="/models/furnitures/Alchemist_s_Steam.glb" position={[cx - 2.8, -0.05, cz + 0]} targetHeight={1.2} rotY={1.6} />
      <RoomProp path="/models/furnitures/Alchemist_s_Shelf.glb" position={[cx - 2.2, 0, cz + 3.2]} targetHeight={1.6} rotY={3.14} />
      <RoomProp path="/models/furnitures/Alchemist_s_Shelf_2.glb" position={[cx , 0, cz + 3.2]} targetHeight={1.6} rotY={3.14} />
      <RoomProp path="/models/furnitures/Infrimary_Antique_block_and_tac.glb" position={[cx + 3 , 0, cz + 3.1]} targetHeight={1} rotY={3.14} />
      <RoomProp path="/models/furnitures/Infrimary_Ember_Engine.glb" position={[cx, 0, cz - 0.1]} targetHeight={2.2} rotY={1} />
    </group>
  );
}
