import { RoomProp } from '../facility/room-prop';

/** Stone pillar clusters and torches for the stone-quarry room */
export function QuarryRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/Railroad_Tracks.glb"  position={[cx + 0.5, 0,   cz - 2.3]} targetHeight={0.15} rotY={1.6} />
      <RoomProp path="/models/furnitures/Minecart_of_Rocks.glb" position={[cx + 0.5, 0.1, cz - 2.3]} targetHeight={0.85} rotY={1.6} />
      <RoomProp path="/models/furnitures/Railroad_Tracks.glb"  position={[cx + 1,   0,   cz + 2.4]} targetHeight={0.15} rotY={1.6} />
    </group>
  );
}
