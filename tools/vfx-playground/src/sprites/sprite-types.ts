export type Direction =
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'
  | 'south'
  | 'south-west'
  | 'west'
  | 'north-west'

export interface AnimationManifest {
  name: string
  directions: Record<string, string[]>
}

export interface CharacterManifest {
  id: string
  animations: AnimationManifest[]
}

export interface SpriteManifest {
  characters: CharacterManifest[]
}
