export const AUDIO = {
  BGM_GUILD: 'bgm-guild',
  BGM_COMBAT: 'bgm-combat',
  SFX_CLICK: 'sfx-click',
  SFX_DISPATCH: 'sfx-dispatch',
  SFX_REWARD: 'sfx-reward',
  SFX_LEVELUP: 'sfx-levelup',
  SFX_HIT: 'sfx-hit',
  SFX_CRIT: 'sfx-crit',
  SFX_DODGE: 'sfx-dodge',
  SFX_DEATH: 'sfx-death',
  SFX_SKILL: 'sfx-skill',
  SFX_RECRUIT: 'sfx-recruit',
  SFX_VICTORY: 'sfx-reward',   // alias: reuse reward sound for victory
  SFX_WIPE: 'sfx-hit',         // alias: reuse hit sound for wipe
} as const;
