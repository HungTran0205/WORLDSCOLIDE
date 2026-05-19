export const AUDIO = {
  BGM_TITLE: 'bgm-title',
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

  // Quest board diegetic SFX — aliased to existing sounds until CC0
  // freesound.org files are sourced. When dedicated assets arrive (e.g.
  // /audio/sfx-paper-unroll.ogg), swap value here AND register the Howl
  // in audio-manager.ts initAudio().
  SFX_PAPER_UNROLL: 'sfx-click',     // alias → click (paper opening)
  SFX_PAPER_FLIP:   'sfx-click',     // alias → click (page turn)
  SFX_WOOD_CLINK:   'sfx-click',     // alias → click (drum tap)
  SFX_INK_STAMP:    'sfx-dispatch',  // alias → dispatch (heavy press)
  SFX_SEAL_BREAK:   'sfx-dispatch',  // alias → dispatch (wax crack)
} as const;
