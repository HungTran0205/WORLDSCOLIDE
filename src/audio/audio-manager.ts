import { Howl, Howler } from 'howler';

const sounds: Record<string, Howl> = {};
let bgmKey: string | null = null;
let initialized = false;

/** Initialize all audio assets — safe to call multiple times */
export function initAudio() {
  if (initialized) return;
  initialized = true;

  // BGM
  sounds['bgm-guild'] = new Howl({
    src: ['/audio/bgm-guild.ogg', '/audio/bgm-guild.mp3'],
    loop: true, volume: 0.3,
  });
  sounds['bgm-combat'] = new Howl({
    src: ['/audio/bgm-combat.ogg', '/audio/bgm-combat.mp3'],
    loop: true, volume: 0.3,
  });

  // SFX
  sounds['sfx-click'] = new Howl({ src: ['/audio/sfx-click.ogg'], volume: 0.5 });
  sounds['sfx-dispatch'] = new Howl({ src: ['/audio/sfx-dispatch.ogg'], volume: 0.5 });
  sounds['sfx-reward'] = new Howl({ src: ['/audio/sfx-reward.ogg'], volume: 0.6 });
  sounds['sfx-levelup'] = new Howl({ src: ['/audio/sfx-levelup.ogg'], volume: 0.7 });
  sounds['sfx-hit'] = new Howl({ src: ['/audio/sfx-hit.ogg'], volume: 0.4 });
  sounds['sfx-crit'] = new Howl({ src: ['/audio/sfx-crit.ogg'], volume: 0.5 });
  sounds['sfx-dodge'] = new Howl({ src: ['/audio/sfx-dodge.ogg'], volume: 0.4 });
  sounds['sfx-death'] = new Howl({ src: ['/audio/sfx-death.ogg'], volume: 0.5 });
  sounds['sfx-skill'] = new Howl({ src: ['/audio/sfx-skill.ogg'], volume: 0.5 });
  sounds['sfx-recruit'] = new Howl({ src: ['/audio/sfx-recruit.ogg'], volume: 0.6 });
}

export function playBGM(key: string) {
  if (bgmKey === key) return;
  // Stop ALL bgm tracks to prevent overlapping
  for (const [k, howl] of Object.entries(sounds)) {
    if (k.startsWith('bgm-')) howl.stop();
  }
  bgmKey = null;
  sounds[key]?.play();
  bgmKey = key;
}

export function stopBGM() {
  for (const [k, howl] of Object.entries(sounds)) {
    if (k.startsWith('bgm-')) howl.stop();
  }
  bgmKey = null;
}

export function playSFX(key: string) {
  sounds[key]?.play();
}

export function setMusicVolume(vol: number) {
  if (bgmKey && sounds[bgmKey]) sounds[bgmKey].volume(vol);
}

export function setSFXVolume(vol: number) {
  Object.entries(sounds).forEach(([key, howl]) => {
    if (!key.startsWith('bgm-')) howl.volume(vol);
  });
}

export function setMute(muted: boolean) {
  Howler.mute(muted);
}
